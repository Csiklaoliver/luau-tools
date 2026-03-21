import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ensureRojo } from "./downloader";

export type RojoStatus = "stopped" | "starting" | "running" | "error";

export class RojoManager {
  private process: cp.ChildProcess | null = null;
  private outputChannel: vscode.OutputChannel;
  private statusEmitter = new vscode.EventEmitter<RojoStatus>();
  private _status: RojoStatus = "stopped";

  public readonly onStatusChange = this.statusEmitter.event;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  public get status(): RojoStatus {
    return this._status;
  }

  private setStatus(status: RojoStatus): void {
    this._status = status;
    this.statusEmitter.fire(status);
  }

  private getWorkspaceRoot(): string | null {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
  }

  private getProjectFile(): string {
    const config = vscode.workspace.getConfiguration("luau-tools");
    return config.get<string>("rojo.projectFile", "default.project.json");
  }

  private getPort(): number {
    const config = vscode.workspace.getConfiguration("luau-tools");
    return config.get<number>("rojo.port", 34872);
  }

  public hasProjectFile(): boolean {
    const root = this.getWorkspaceRoot();
    if (!root) return false;
    return fs.existsSync(path.join(root, this.getProjectFile()));
  }

  public async start(): Promise<void> {
    if (this._status === "running" || this._status === "starting") {
      this.outputChannel.appendLine("[luau-tools/rojo] Already running.");
      return;
    }

    const root = this.getWorkspaceRoot();
    if (!root) {
      await vscode.window.showErrorMessage(
        "Luau Tools: No workspace folder open. Open a folder to start Rojo sync."
      );
      return;
    }

    const projectFile = this.getProjectFile();
    const projectFilePath = path.join(root, projectFile);

    if (!fs.existsSync(projectFilePath)) {
      const choice = await vscode.window.showWarningMessage(
        `Luau Tools: ${projectFile} not found in workspace root.\nRun "Luau: Init Rojo Project" to create it.`,
        "Init Rojo Project",
        "Cancel"
      );
      if (choice === "Init Rojo Project") {
        await vscode.commands.executeCommand("luau-tools.rojoInit");
      }
      return;
    }

    this.setStatus("starting");
    this.outputChannel.appendLine("[luau-tools/rojo] Starting Rojo serve...");

    let binaryPath: string;
    try {
      binaryPath = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Luau Tools",
          cancellable: false,
        },
        async (progress) => ensureRojo(progress)
      );
    } catch (err) {
      this.setStatus("error");
      const message = err instanceof Error ? err.message : String(err);
      this.outputChannel.appendLine(
        `[luau-tools/rojo] Failed to get binary: ${message}`
      );
      await vscode.window.showErrorMessage(
        `Luau Tools: Failed to download Rojo.\n\n${message}`
      );
      return;
    }

    const port = this.getPort();
    const args = ["serve", projectFile, "--port", String(port)];

    this.outputChannel.appendLine(
      `[luau-tools/rojo] ${binaryPath} ${args.join(" ")} (cwd: ${root})`
    );

    try {
      this.process = cp.spawn(binaryPath, args, {
        cwd: root,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      this.setStatus("error");
      const message = err instanceof Error ? err.message : String(err);
      this.outputChannel.appendLine(
        `[luau-tools/rojo] Failed to spawn process: ${message}`
      );
      await vscode.window.showErrorMessage(
        `Luau Tools: Failed to start Rojo.\n${message}`
      );
      return;
    }

    this.process.stdout?.on("data", (data: Buffer) => {
      const text = data.toString().trimEnd();
      this.outputChannel.appendLine(text);

      // Rojo prints "Listening on port XXXXX" when ready
      if (text.includes("Listening on port") || text.includes("Serving")) {
        this.setStatus("running");
        this.outputChannel.appendLine(
          `[luau-tools/rojo] Rojo is syncing on port ${port}`
        );
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const text = data.toString().trimEnd();
      this.outputChannel.appendLine(`[stderr] ${text}`);

      // Detect port-in-use error
      if (
        text.includes("Address already in use") ||
        text.includes("EADDRINUSE") ||
        text.includes("port") && text.includes("in use")
      ) {
        this.setStatus("error");
        void vscode.window.showErrorMessage(
          `Luau Tools: Rojo port ${port} is already in use.\n` +
            `Change luau-tools.rojo.port or stop the process using it.`
        );
      }
    });

    this.process.on("error", (err) => {
      this.setStatus("error");
      this.outputChannel.appendLine(
        `[luau-tools/rojo] Process error: ${err.message}`
      );
    });

    this.process.on("exit", (code, signal) => {
      const wasRunning = this._status === "running" || this._status === "starting";
      this.process = null;

      if (wasRunning && this._status !== "stopped") {
        // Unexpected exit
        this.setStatus("error");
        this.outputChannel.appendLine(
          `[luau-tools/rojo] Process exited unexpectedly (code=${code ?? "?"}, signal=${signal ?? "?"}).`
        );
        void vscode.window.showWarningMessage(
          `Luau Tools: Rojo stopped unexpectedly (exit code ${code ?? signal}).` +
            ` Check the Luau (Rojo) output channel for details.`
        );
      } else {
        this.setStatus("stopped");
        this.outputChannel.appendLine(
          `[luau-tools/rojo] Process exited (code=${code ?? "?"}).`
        );
      }
    });

    // Set status to running optimistically after a short delay if we haven't
    // received the "Listening" message (some Rojo versions may vary).
    setTimeout(() => {
      if (this._status === "starting" && this.process !== null) {
        this.setStatus("running");
      }
    }, 3000);
  }

  public async stop(): Promise<void> {
    if (!this.process) {
      this.setStatus("stopped");
      return;
    }

    this.outputChannel.appendLine("[luau-tools/rojo] Stopping Rojo...");
    // Mark as stopped before kill so the exit handler doesn't show the warning
    this.setStatus("stopped");

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      const proc = this.process;
      this.process = null;

      const timeout = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          // ignore
        }
        resolve();
      }, 3000);

      proc.on("exit", () => {
        clearTimeout(timeout);
        resolve();
      });

      try {
        proc.kill("SIGTERM");
      } catch {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  public async restart(): Promise<void> {
    this.outputChannel.appendLine("[luau-tools/rojo] Restarting Rojo...");
    await this.stop();
    await this.start();
  }

  public showOutput(): void {
    this.outputChannel.show();
  }

  public async initProject(): Promise<void> {
    const root = this.getWorkspaceRoot();
    if (!root) {
      await vscode.window.showErrorMessage(
        "Luau Tools: No workspace folder open."
      );
      return;
    }

    let binaryPath: string;
    try {
      binaryPath = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Luau Tools: Setting up Rojo",
          cancellable: false,
        },
        async (progress) => ensureRojo(progress)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await vscode.window.showErrorMessage(
        `Luau Tools: Failed to download Rojo.\n\n${message}`
      );
      return;
    }

    const projectFile = this.getProjectFile();
    const projectFilePath = path.join(root, projectFile);

    if (fs.existsSync(projectFilePath)) {
      const choice = await vscode.window.showWarningMessage(
        `Luau Tools: ${projectFile} already exists. Overwrite?`,
        "Overwrite",
        "Cancel"
      );
      if (choice !== "Overwrite") return;
    }

    try {
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const execFileAsync = promisify(execFile);

      await execFileAsync(binaryPath, ["init", "--kind", "place"], { cwd: root });
      this.outputChannel.appendLine(
        `[luau-tools/rojo] Initialized Rojo project in ${root}`
      );
    } catch (err) {
      // rojo init may fail on older versions or if project already has files;
      // fall back to writing the template ourselves
      this.outputChannel.appendLine(
        `[luau-tools/rojo] rojo init failed, writing template manually: ${String(err)}`
      );
      const projectName = path.basename(root);
      const template = buildDefaultProjectJson(projectName);
      fs.writeFileSync(projectFilePath, JSON.stringify(template, null, 2) + "\n", "utf-8");
    }

    if (!fs.existsSync(projectFilePath)) {
      await vscode.window.showErrorMessage(
        `Luau Tools: Rojo init did not create ${projectFile}. Check the output channel.`
      );
      return;
    }

    // Open the created file
    const doc = await vscode.workspace.openTextDocument(projectFilePath);
    await vscode.window.showTextDocument(doc);

    await vscode.window.showInformationMessage(
      `Luau Tools: Rojo project initialized. Open Roblox Studio, install the Rojo plugin, then run "Luau: Start Rojo Sync".`
    );
  }

  public dispose(): void {
    this.statusEmitter.dispose();
    if (this.process) {
      try {
        this.process.kill("SIGTERM");
      } catch {
        // ignore
      }
      this.process = null;
    }
  }
}

function buildDefaultProjectJson(projectName: string): object {
  return {
    name: projectName,
    tree: {
      $className: "DataModel",
      ServerScriptService: {
        $className: "ServerScriptService",
        Server: {
          $path: "src/server",
        },
      },
      ReplicatedStorage: {
        $className: "ReplicatedStorage",
        Shared: {
          $path: "src/shared",
        },
      },
      StarterPlayer: {
        $className: "StarterPlayer",
        StarterPlayerScripts: {
          $className: "StarterPlayerScripts",
          Client: {
            $path: "src/client",
          },
        },
      },
    },
  };
}
