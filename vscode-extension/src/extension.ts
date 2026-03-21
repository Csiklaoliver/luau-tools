import * as vscode from "vscode";
import { LuauLanguageServer, LspStatus } from "./lsp";
import { registerCommands } from "./commands";

let server: LuauLanguageServer | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;

function updateStatusBar(status: LspStatus): void {
  if (!statusBarItem) return;

  switch (status) {
    case "starting":
      statusBarItem.text = "$(sync~spin) Luau LSP";
      statusBarItem.tooltip = "Luau Language Server is starting...";
      statusBarItem.backgroundColor = undefined;
      statusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.warningForeground"
      );
      break;
    case "running":
      statusBarItem.text = "$(check) Luau LSP";
      statusBarItem.tooltip = "Luau Language Server is running";
      statusBarItem.backgroundColor = undefined;
      statusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.prominentForeground"
      );
      break;
    case "error":
      statusBarItem.text = "$(error) Luau LSP";
      statusBarItem.tooltip =
        "Luau Language Server encountered an error. Click to show output.";
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      statusBarItem.color = undefined;
      break;
    case "stopped":
      statusBarItem.text = "$(circle-slash) Luau LSP";
      statusBarItem.tooltip =
        "Luau Language Server is stopped. Click to restart.";
      statusBarItem.backgroundColor = undefined;
      statusBarItem.color = new vscode.ThemeColor(
        "statusBarItem.warningForeground"
      );
      break;
  }

  statusBarItem.show();
}

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel("Luau");
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine("[luau-tools] Extension activating...");

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10
  );
  statusBarItem.command = "luau-tools.showOutput";
  context.subscriptions.push(statusBarItem);

  // Initialize server
  server = new LuauLanguageServer(outputChannel);
  context.subscriptions.push(server);

  // Wire status bar to server status
  server.onStatusChange((status) => {
    updateStatusBar(status);
  });

  // Register commands
  registerCommands(context, server, outputChannel);

  // Update status bar on click for error/stopped states
  statusBarItem.command = "luau-tools.showOutput";

  // Start LSP
  updateStatusBar("starting");
  await server.start(context);

  // Watch for config changes and restart
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
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
    })
  );

  outputChannel.appendLine("[luau-tools] Extension activated.");
}

export async function deactivate(): Promise<void> {
  if (server) {
    await server.stop();
    server = null;
  }
}
