#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { runCheck } from "./check.js";
import { runFmt } from "./fmt.js";
import { runLint } from "./lint.js";
import { runInit } from "./init.js";
import {
  ensureLuauLsp,
  downloadLuauLsp,
  getCachedVersion,
  getLatestRelease,
  getBinaryPath,
} from "./downloader.js";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8")
) as { version: string };

const program = new Command();

program
  .name("luau-tools")
  .description(
    "Full Luau developer experience outside Roblox Studio.\nType checking, formatting, linting, and more."
  )
  .version(packageJson.version)
  .addHelpText(
    "after",
    `
Examples:
  $ luau-tools check src/          type-check all files in src/
  $ luau-tools fmt src/            format all Luau files in src/
  $ luau-tools lint src/           lint all Luau files in src/
  $ luau-tools init my-project     create a new Luau project
  $ luau-tools run src/main.luau   run a Luau file
  $ luau-tools version             show version info
  $ luau-tools update              update luau-lsp to latest
`
  );

// Global options
program
  .option("--json", "Output results as JSON", false)
  .option("--no-color", "Disable colored output", false)
  .option("--config <path>", "Path to .luaurc config file")
  .option("--verbose", "Detailed output", false);

// check command
program
  .command("check [path]")
  .description("Type-check Luau files or directories")
  .addHelpText(
    "after",
    `
Examples:
  $ luau-tools check .
  $ luau-tools check src/main.luau
  $ luau-tools check src/ --json
`
  )
  .action(async (targetPath: string | undefined) => {
    const opts = program.opts<{
      json: boolean;
      noColor: boolean;
      config?: string;
      verbose: boolean;
    }>();
    await runCheck(targetPath ?? ".", {
      json: opts.json,
      noColor: !opts.color,
      config: opts.config,
      verbose: opts.verbose,
    });
  });

// fmt command
program
  .command("fmt [path]")
  .description("Format Luau code")
  .option("--check", "Check formatting without writing files")
  .addHelpText(
    "after",
    `
Examples:
  $ luau-tools fmt src/
  $ luau-tools fmt src/main.luau
  $ luau-tools fmt --check src/    check if files are formatted
`
  )
  .action(
    async (targetPath: string | undefined, cmdOpts: { check?: boolean }) => {
      const opts = program.opts<{
        json: boolean;
        noColor: boolean;
        config?: string;
        verbose: boolean;
      }>();
      await runFmt(targetPath ?? ".", {
        json: opts.json,
        noColor: !opts.color,
        config: opts.config,
        verbose: opts.verbose,
        check: cmdOpts.check ?? false,
      });
    }
  );

// lint command
program
  .command("lint [path]")
  .description("Lint Luau files with configurable rules (via .luaurc)")
  .addHelpText(
    "after",
    `
Examples:
  $ luau-tools lint src/
  $ luau-tools lint --config .luaurc src/
`
  )
  .action(async (targetPath: string | undefined) => {
    const opts = program.opts<{
      json: boolean;
      noColor: boolean;
      config?: string;
      verbose: boolean;
    }>();
    await runLint(targetPath ?? ".", {
      json: opts.json,
      noColor: !opts.color,
      config: opts.config,
      verbose: opts.verbose,
    });
  });

// init command
program
  .command("init [directory]")
  .description(
    "Initialize a new Luau project (creates .luaurc, src/, README.md)"
  )
  .addHelpText(
    "after",
    `
Examples:
  $ luau-tools init                init in current directory
  $ luau-tools init my-project    create new project in my-project/
`
  )
  .action(async (directory: string | undefined) => {
    const opts = program.opts<{
      json: boolean;
      noColor: boolean;
      verbose: boolean;
    }>();
    await runInit(directory ?? ".", {
      json: opts.json,
      noColor: !opts.color,
      verbose: opts.verbose,
    });
  });

// run command
program
  .command("run <file>")
  .description("Run a Luau file (requires lute runtime)")
  .addHelpText(
    "after",
    `
Runs a Luau file using the 'lute' runtime (https://github.com/nicolo-ribaudo/lute).
If lute is not installed, instructions will be shown.

Examples:
  $ luau-tools run src/main.luau
`
  )
  .action(async (file: string) => {
    const opts = program.opts<{ noColor: boolean }>();
    const useColor = !opts.noColor && process.stdout.isTTY;
    const resolvedFile = path.resolve(file);

    if (!fs.existsSync(resolvedFile)) {
      console.error(
        useColor
          ? chalk.red(`Error: File not found: ${resolvedFile}`)
          : `Error: File not found: ${resolvedFile}`
      );
      process.exit(1);
    }

    // Check if lute is available
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);

    try {
      await execFileAsync("lute", ["--version"]);
    } catch {
      console.error(
        useColor
          ? chalk.yellow("lute runtime not found.")
          : "lute runtime not found."
      );
      console.error("");
      console.error("To run Luau files outside Roblox Studio, install lute:");
      console.error(
        useColor
          ? `  ${chalk.cyan("https://github.com/nicolo-ribaudo/lute")}`
          : "  https://github.com/nicolo-ribaudo/lute"
      );
      console.error("");
      console.error("Once installed:");
      console.error(
        useColor
          ? `  ${chalk.cyan(`lute ${resolvedFile}`)}`
          : `  lute ${resolvedFile}`
      );
      process.exit(1);
    }

    // Run with lute
    const { spawn } = await import("child_process");
    const child = spawn("lute", [resolvedFile], { stdio: "inherit" });
    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  });

// version command
program
  .command("version")
  .description("Show luau-tools and luau-lsp versions")
  .action(async () => {
    const opts = program.opts<{ json: boolean; noColor: boolean }>();
    const useColor = !opts.noColor && process.stdout.isTTY;

    const cached = getCachedVersion();
    const binaryPath = getBinaryPath();
    const binaryExists = fs.existsSync(binaryPath);

    let lspVersion = cached?.version ?? "not installed";

    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            luauTools: packageJson.version,
            luauLsp: {
              version: lspVersion,
              path: binaryExists ? binaryPath : null,
              platform: cached?.platform ?? null,
              downloadedAt: cached?.downloadedAt ?? null,
            },
            node: process.version,
            platform: `${process.platform}-${process.arch}`,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(
      useColor
        ? `${chalk.bold("luau-tools")}  ${chalk.cyan(`v${packageJson.version}`)}`
        : `luau-tools  v${packageJson.version}`
    );

    if (binaryExists) {
      console.log(
        useColor
          ? `${chalk.bold("luau-lsp")}    ${chalk.cyan(lspVersion)}  ${chalk.dim(binaryPath)}`
          : `luau-lsp    ${lspVersion}  ${binaryPath}`
      );
    } else {
      console.log(
        useColor
          ? `${chalk.bold("luau-lsp")}    ${chalk.yellow("not installed")}  (run ${chalk.cyan("luau-tools update")} to install)`
          : `luau-lsp    not installed  (run 'luau-tools update' to install)`
      );
    }

    console.log(
      useColor
        ? `${chalk.bold("node")}        ${chalk.dim(process.version)}`
        : `node        ${process.version}`
    );
    console.log(
      useColor
        ? `${chalk.bold("platform")}    ${chalk.dim(`${process.platform}-${process.arch}`)}`
        : `platform    ${process.platform}-${process.arch}`
    );
  });

// update command
program
  .command("update")
  .description("Update luau-lsp binary to the latest release")
  .option("--version <version>", "Install a specific version instead of latest")
  .addHelpText(
    "after",
    `
Examples:
  $ luau-tools update
  $ luau-tools update --version 1.32.0
`
  )
  .action(async (cmdOpts: { version?: string }) => {
    const opts = program.opts<{ json: boolean; noColor: boolean }>();
    const useColor = !opts.noColor && process.stdout.isTTY;

    const spinner = ora({
      text: "Checking latest luau-lsp release...",
      isSilent: opts.json,
      color: "cyan",
    }).start();

    try {
      const targetVersion = cmdOpts.version ?? "latest";
      let latestVersion: string;

      if (targetVersion === "latest") {
        const release = await getLatestRelease();
        latestVersion = release.tag_name;
      } else {
        latestVersion = targetVersion;
      }

      const cached = getCachedVersion();
      if (cached && cached.version === latestVersion && fs.existsSync(getBinaryPath())) {
        spinner.succeed(
          useColor
            ? `luau-lsp is already up to date: ${chalk.cyan(latestVersion)}`
            : `luau-lsp is already up to date: ${latestVersion}`
        );
        return;
      }

      spinner.text = `Downloading luau-lsp ${latestVersion}...`;
      const binaryPath = await downloadLuauLsp(latestVersion, spinner);

      spinner.succeed(
        useColor
          ? `Updated luau-lsp to ${chalk.cyan(latestVersion)} → ${chalk.dim(binaryPath)}`
          : `Updated luau-lsp to ${latestVersion}`
      );

      if (opts.json) {
        console.log(
          JSON.stringify({ version: latestVersion, path: binaryPath }, null, 2)
        );
      }
    } catch (err) {
      spinner.fail("Update failed");
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse(process.argv);
