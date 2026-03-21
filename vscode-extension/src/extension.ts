import * as vscode from "vscode";
import { LuauLanguageServer, LspStatus } from "./lsp";
import { RojoManager, RojoStatus } from "./rojo/index";
import { registerCommands } from "./commands";

let server: LuauLanguageServer | null = null;
let rojoManager: RojoManager | null = null;
let lspStatusBarItem: vscode.StatusBarItem | null = null;
let rojoStatusBarItem: vscode.StatusBarItem | null = null;

function updateLspStatusBar(status: LspStatus): void {
  if (!lspStatusBarItem) return;

  switch (status) {
    case "starting":
      lspStatusBarItem.text = "$(sync~spin) Luau";
      lspStatusBarItem.tooltip = "Luau Language Server is starting...";
      lspStatusBarItem.backgroundColor = undefined;
      lspStatusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.warningForeground"
      );
      break;
    case "running":
      lspStatusBarItem.text = "$(check) Luau";
      lspStatusBarItem.tooltip = "Luau Language Server is running";
      lspStatusBarItem.backgroundColor = undefined;
      lspStatusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.prominentForeground"
      );
      break;
    case "error":
      lspStatusBarItem.text = "$(error) Luau";
      lspStatusBarItem.tooltip =
        "Luau Language Server encountered an error. Click to show output.";
      lspStatusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      lspStatusBarItem.color = undefined;
      break;
    case "stopped":
      lspStatusBarItem.text = "$(circle-slash) Luau";
      lspStatusBarItem.tooltip =
        "Luau Language Server is stopped. Click to show output.";
      lspStatusBarItem.backgroundColor = undefined;
      lspStatusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.warningForeground"
      );
      break;
  }

  lspStatusBarItem.show();
}

function updateRojoStatusBar(status: RojoStatus): void {
  if (!rojoStatusBarItem) return;

  switch (status) {
    case "starting":
      rojoStatusBarItem.text = "$(sync~spin) Rojo: Starting...";
      rojoStatusBarItem.tooltip = "Rojo sync is starting...";
      rojoStatusBarItem.backgroundColor = undefined;
      rojoStatusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.warningForeground"
      );
      break;
    case "running":
      rojoStatusBarItem.text = "$(sync) Rojo: Syncing";
      rojoStatusBarItem.tooltip =
        "Rojo is syncing with Roblox Studio. Click for options.";
      rojoStatusBarItem.backgroundColor = undefined;
      rojoStatusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.prominentForeground"
      );
      break;
    case "error":
      rojoStatusBarItem.text = "$(error) Rojo: Error";
      rojoStatusBarItem.tooltip =
        "Rojo encountered an error. Click for options.";
      rojoStatusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      rojoStatusBarItem.color = undefined;
      break;
    case "stopped":
      rojoStatusBarItem.text = "$(circle-slash) Rojo: Stopped";
      rojoStatusBarItem.tooltip = "Rojo sync is stopped. Click for options.";
      rojoStatusBarItem.backgroundColor = undefined;
      rojoStatusBarItem.color = undefined;
      break;
  }

  rojoStatusBarItem.show();
}

async function showRojoQuickPick(): Promise<void> {
  if (!rojoManager) return;

  const status = rojoManager.status;
  const isRunning = status === "running" || status === "starting";

  const items: vscode.QuickPickItem[] = [
    isRunning
      ? { label: "$(debug-stop) Stop Sync", description: "Stop Rojo sync" }
      : { label: "$(play) Start Sync", description: "Start Rojo sync" },
    { label: "$(debug-restart) Restart Sync", description: "Restart Rojo sync" },
    { label: "$(output) Show Output", description: "Open Rojo output channel" },
    { label: "$(cloud-download) Update Rojo", description: "Download latest Rojo binary" },
  ];

  const choice = await vscode.window.showQuickPick(items, {
    title: "Rojo Sync",
    placeHolder: "Select an action",
  });

  if (!choice) return;

  if (choice.label.includes("Start Sync")) {
    await vscode.commands.executeCommand("luau-tools.rojoStart");
  } else if (choice.label.includes("Stop Sync")) {
    await vscode.commands.executeCommand("luau-tools.rojoStop");
  } else if (choice.label.includes("Restart Sync")) {
    await vscode.commands.executeCommand("luau-tools.rojoRestart");
  } else if (choice.label.includes("Show Output")) {
    await vscode.commands.executeCommand("luau-tools.rojoShowOutput");
  } else if (choice.label.includes("Update Rojo")) {
    await vscode.commands.executeCommand("luau-tools.rojoUpdate");
  }
}

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  // ── Output channels — created first so we can log errors ────────────────────
  const lspOutputChannel = vscode.window.createOutputChannel("Luau");
  const rojoOutputChannel = vscode.window.createOutputChannel("Luau (Rojo)");
  context.subscriptions.push(lspOutputChannel, rojoOutputChannel);

  lspOutputChannel.appendLine("[luau-tools] Extension activating...");

  try {
    // ── LSP status bar (left side) ─────────────────────────────────────────────
    lspStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      11
    );
    lspStatusBarItem.command = "luau-tools.showOutput";
    context.subscriptions.push(lspStatusBarItem);

    // ── Rojo status bar (right of LSP) ────────────────────────────────────────
    rojoStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      10
    );
    rojoStatusBarItem.command = "luau-tools.rojoQuickPick";
    context.subscriptions.push(rojoStatusBarItem);

    // ── Language server ────────────────────────────────────────────────────────
    server = new LuauLanguageServer(lspOutputChannel);
    context.subscriptions.push(server);

    server.onStatusChange((status) => {
      updateLspStatusBar(status);
    });

    // ── Rojo manager ───────────────────────────────────────────────────────────
    rojoManager = new RojoManager(rojoOutputChannel);
    context.subscriptions.push(rojoManager);

    rojoManager.onStatusChange((status) => {
      updateRojoStatusBar(status);
    });

    // ── Register ALL commands — must happen before any await so that commands
    //    are available even if the LSP download or startup subsequently fails ──
    registerCommands(context, server, lspOutputChannel, rojoManager);

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "luau-tools.rojoQuickPick",
        showRojoQuickPick
      )
    );

    // ── Initial status bar state ───────────────────────────────────────────────
    updateLspStatusBar("starting");
    updateRojoStatusBar("stopped");

    // ── Config change watcher ──────────────────────────────────────────────────
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(async (e) => {
        // LSP settings
        if (
          e.affectsConfiguration("luau-tools.luauVersion") ||
          e.affectsConfiguration("luau-tools.lspPath") ||
          e.affectsConfiguration("luau-tools.diagnosticsEnabled") ||
          e.affectsConfiguration("luau-tools.completion.enabled")
        ) {
          const choice = await vscode.window.showInformationMessage(
            "Luau Tools: Settings changed. Restart the language server to apply changes.",
            "Restart Now",
            "Later"
          );
          if (choice === "Restart Now" && server) {
            await server.restart(context);
          }
        }

        // Rojo settings
        if (
          e.affectsConfiguration("luau-tools.rojo.enabled") ||
          e.affectsConfiguration("luau-tools.rojo.rojoPath") ||
          e.affectsConfiguration("luau-tools.rojo.port") ||
          e.affectsConfiguration("luau-tools.rojo.projectFile")
        ) {
          if (
            rojoManager &&
            (rojoManager.status === "running" ||
              rojoManager.status === "starting")
          ) {
            const choice = await vscode.window.showInformationMessage(
              "Luau Tools: Rojo settings changed. Restart Rojo sync to apply changes.",
              "Restart Now",
              "Later"
            );
            if (choice === "Restart Now") {
              await rojoManager.restart();
            }
          }
        }
      })
    );

    lspOutputChannel.appendLine("[luau-tools] Commands registered. Starting LSP...");

    // ── Start language server (async — errors are handled inside start()) ──────
    await server.start(context);

    // ── Auto-start Rojo if configured ──────────────────────────────────────────
    const config = vscode.workspace.getConfiguration("luau-tools");
    if (
      config.get<boolean>("rojo.enabled", true) &&
      config.get<boolean>("rojo.autoStart", false)
    ) {
      lspOutputChannel.appendLine(
        "[luau-tools] rojo.autoStart is enabled — starting Rojo..."
      );
      await rojoManager.start();
    }

    lspOutputChannel.appendLine("[luau-tools] Extension activated.");
  } catch (err) {
    const message = err instanceof Error
      ? `${err.message}\n\nStack: ${err.stack ?? "(no stack)"}`
      : String(err);

    lspOutputChannel.appendLine(`[luau-tools] ACTIVATION ERROR: ${message}`);
    lspOutputChannel.show(true);

    await vscode.window.showErrorMessage(
      `Luau Tools failed to activate: ${err instanceof Error ? err.message : String(err)}\n\nSee the "Luau" output channel for details.`
    );
  }
}

export async function deactivate(): Promise<void> {
  if (rojoManager) {
    await rojoManager.stop();
    rojoManager = null;
  }
  if (server) {
    await server.stop();
    server = null;
  }
}
