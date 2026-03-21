import * as vscode from "vscode";
import { LuauLanguageServer } from "./lsp";
import { downloadLuauLsp, getCachedVersion } from "./downloader";
import { RojoManager } from "./rojo/index";
import { downloadRojo, getCachedRojoVersion } from "./rojo/downloader";

export function registerCommands(
  context: vscode.ExtensionContext,
  server: LuauLanguageServer,
  outputChannel: vscode.OutputChannel,
  rojoManager: RojoManager
): void {
  // ── LSP commands ────────────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.restartServer", async () => {
      outputChannel.appendLine(
        "[luau-tools] Restart Language Server command triggered."
      );
      await server.restart(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.showOutput", () => {
      server.showOutput();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "luau-tools.checkCurrentFile",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          await vscode.window.showWarningMessage(
            "Luau Tools: No active file to check."
          );
          return;
        }

        const doc = editor.document;
        if (doc.languageId !== "luau" && !doc.fileName.endsWith(".lua")) {
          await vscode.window.showWarningMessage(
            "Luau Tools: Active file is not a Luau file."
          );
          return;
        }

        if (doc.isDirty) {
          await doc.save();
        }

        outputChannel.appendLine(`[luau-tools] Checking file: ${doc.fileName}`);
        outputChannel.show(true);

        await vscode.window.showInformationMessage(
          `Luau Tools: Checking ${vscode.workspace.asRelativePath(doc.fileName)}...`
        );

        await vscode.commands.executeCommand(
          "vscode.executeFormatDocumentProvider",
          doc.uri
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.updateLsp", async () => {
      const cached = getCachedVersion();
      const currentVersion = cached ? cached.version : "none";

      outputChannel.appendLine(
        `[luau-tools] Updating luau-lsp (current: ${currentVersion})...`
      );

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Luau Tools: Updating luau-lsp",
            cancellable: false,
          },
          async (progress) => {
            const binaryPath = await downloadLuauLsp("latest", progress);
            const newVersion = getCachedVersion();
            outputChannel.appendLine(
              `[luau-tools] Updated to ${newVersion?.version ?? "unknown"} at ${binaryPath}`
            );
          }
        );

        const newVersion = getCachedVersion();
        const versionStr = newVersion?.version ?? "latest";

        const choice = await vscode.window.showInformationMessage(
          `Luau Tools: Updated luau-lsp to ${versionStr}. Restart the language server to apply.`,
          "Restart Now",
          "Later"
        );

        if (choice === "Restart Now") {
          await server.restart(context);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`[luau-tools] Update failed: ${message}`);
        await vscode.window.showErrorMessage(
          `Luau Tools: Failed to update luau-lsp.\n${message}`
        );
      }
    })
  );

  // ── Rojo commands ────────────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.rojoStart", async () => {
      const config = vscode.workspace.getConfiguration("luau-tools");
      if (!config.get<boolean>("rojo.enabled", true)) {
        await vscode.window.showWarningMessage(
          "Luau Tools: Rojo is disabled. Enable it via luau-tools.rojo.enabled."
        );
        return;
      }
      await rojoManager.start();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.rojoStop", async () => {
      await rojoManager.stop();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.rojoRestart", async () => {
      await rojoManager.restart();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.rojoInit", async () => {
      await rojoManager.initProject();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.rojoShowOutput", () => {
      rojoManager.showOutput();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.rojoUpdate", async () => {
      const cached = getCachedRojoVersion();
      const currentVersion = cached ? cached.version : "none";

      outputChannel.appendLine(
        `[luau-tools] Updating Rojo (current: ${currentVersion})...`
      );

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Luau Tools: Updating Rojo",
            cancellable: false,
          },
          async (progress) => {
            const binaryPath = await downloadRojo(progress);
            const newVersion = getCachedRojoVersion();
            outputChannel.appendLine(
              `[luau-tools] Rojo updated to ${newVersion?.version ?? "unknown"} at ${binaryPath}`
            );
          }
        );

        const newVersion = getCachedRojoVersion();
        const versionStr = newVersion?.version ?? "latest";

        const choice = await vscode.window.showInformationMessage(
          `Luau Tools: Updated Rojo to ${versionStr}. Restart Rojo sync to use the new binary.`,
          "Restart Sync",
          "Later"
        );

        if (choice === "Restart Sync") {
          await rojoManager.restart();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`[luau-tools/rojo] Update failed: ${message}`);
        await vscode.window.showErrorMessage(
          `Luau Tools: Failed to update Rojo.\n${message}`
        );
      }
    })
  );
}
