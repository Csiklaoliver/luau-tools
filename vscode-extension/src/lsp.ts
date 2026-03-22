import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  State,
} from "vscode-languageclient/node";
import { ensureLuauLsp } from "./downloader";

export type LspStatus = "stopped" | "starting" | "running" | "error";

export class LuauLanguageServer {
  private client: LanguageClient | null = null;
  private outputChannel: vscode.OutputChannel;
  private statusEmitter = new vscode.EventEmitter<LspStatus>();
  private _status: LspStatus = "stopped";

  public readonly onStatusChange = this.statusEmitter.event;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  public get status(): LspStatus {
    return this._status;
  }

  private setStatus(status: LspStatus): void {
    this._status = status;
    this.statusEmitter.fire(status);
  }

  public async start(context: vscode.ExtensionContext): Promise<void> {
    if (this.client && this.client.state === State.Running) {
      this.outputChannel.appendLine("[luau-tools] LSP already running.");
      return;
    }

    this.setStatus("starting");

    const config = vscode.workspace.getConfiguration("luau-tools");
    const luauVersion = config.get<string>("luauVersion", "latest");
    const completionEnabled = config.get<boolean>("completion.enabled", true);

    let binaryPath: string;

    try {
      binaryPath = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Luau Tools",
          cancellable: false,
        },
        async (progress) => {
          return ensureLuauLsp(luauVersion, progress);
        }
      );
    } catch (err) {
      this.setStatus("error");
      const message = err instanceof Error ? err.message : String(err);
      this.outputChannel.appendLine(`[luau-tools] Failed to get binary: ${message}`);
      await vscode.window.showErrorMessage(
        `Luau Tools: Failed to download luau-lsp.\n${message}`
      );
      return;
    }

    const args: string[] = ["lsp"];

    const serverOptions: ServerOptions = {
      run: {
        command: binaryPath,
        args,
        transport: TransportKind.stdio,
      },
      debug: {
        command: binaryPath,
        args,
        transport: TransportKind.stdio,
      },
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        { scheme: "file", language: "luau" },
        { scheme: "file", pattern: "**/*.luau" },
        { scheme: "file", pattern: "**/*.lua" },
      ],
      outputChannel: this.outputChannel,
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher("**/.luaurc"),
      },
      initializationOptions: {
        completion: {
          enabled: completionEnabled,
        },
      },
      markdown: {
        isTrusted: true,
      },
    };

    this.client = new LanguageClient(
      "luau-tools",
      "Luau Language Server",
      serverOptions,
      clientOptions
    );

    this.client.onDidChangeState((e) => {
      if (e.newState === State.Running) {
        this.setStatus("running");
        this.outputChannel.appendLine("[luau-tools] Language server is running.");
      } else if (e.newState === State.Stopped) {
        if (this._status !== "stopped") {
          this.setStatus("stopped");
          this.outputChannel.appendLine("[luau-tools] Language server stopped.");
        }
      }
    });

    try {
      await this.client.start();
      context.subscriptions.push(this.client);
    } catch (err) {
      this.setStatus("error");
      const message = err instanceof Error ? err.message : String(err);
      this.outputChannel.appendLine(
        `[luau-tools] Failed to start language server: ${message}`
      );
      await vscode.window.showErrorMessage(
        `Luau Tools: Language server failed to start.\n${message}\n\nSee the Luau output channel for details.`
      );
    }
  }

  public async stop(): Promise<void> {
    if (this.client) {
      this.setStatus("stopped");
      await this.client.stop();
      this.client = null;
    }
  }

  public async restart(context: vscode.ExtensionContext): Promise<void> {
    this.outputChannel.appendLine("[luau-tools] Restarting language server...");
    await this.stop();
    await this.start(context);
  }

  public showOutput(): void {
    this.outputChannel.show();
  }

  public dispose(): void {
    this.statusEmitter.dispose();
    if (this.client) {
      void this.client.stop();
    }
  }
}
