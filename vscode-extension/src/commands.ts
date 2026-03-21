import * as vscode from "vscode";
import { LuauLanguageServer } from "./lsp";
import { downloadLuauLsp, getCachedVersion } from "./downloader";

export function registerCommands(
  context: vscode.ExtensionContext,
  server: LuauLanguageServer,
  outputChannel: vscode.OutputChannel
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("luau-tools.restartServer", async () => {
      outputChannel.appendLine("[luau-tools] Restart Language Server command triggered.");
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

        outputChannel.appendLine(
          `[luau-tools] Checking file: ${doc.fileName}`
        );
        outputChannel.show(true);

        await vscode.window.showInformationMessage(
          `Luau Tools: Checking ${vscode.workspace.asRelativePath(doc.fileName)}...`
        );

        // Trigger diagnostics refresh by sending a didSave notification
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
}
