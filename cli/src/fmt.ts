import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import ora from "ora";
import { ensureLuauLsp } from "./downloader.js";

const execFileAsync = promisify(execFile);

export interface FmtOptions {
  json: boolean;
  noColor: boolean;
  config?: string;
  verbose: boolean;
  check: boolean; // --check flag: only verify, don't write
}

interface FmtResult {
  file: string;
  changed: boolean;
  error?: string;
}

async function formatFile(
  binaryPath: string,
  filePath: string,
  checkOnly: boolean,
  configPath?: string
): Promise<FmtResult> {
  const args: string[] = ["format"];

  if (configPath) {
    args.push(`--settings=${configPath}`);
  }

  if (checkOnly) {
    args.push("--check");
  }

  args.push(filePath);

  try {
    await execFileAsync(binaryPath, args);
    return { file: filePath, changed: false };
  } catch (err) {
    const execErr = err as { code?: number; stderr?: string };
    // Exit code 1 when --check finds differences
    if (execErr.code === 1 && checkOnly) {
      return { file: filePath, changed: true };
    }
    return {
      file: filePath,
      changed: false,
      error: execErr.stderr ?? String(err),
    };
  }
}

function collectLuauFiles(targetPath: string): string[] {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (targetPath.endsWith(".luau") || targetPath.endsWith(".lua")) {
      return [targetPath];
    }
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectLuauFiles(fullPath));
    } else if (entry.name.endsWith(".luau") || entry.name.endsWith(".lua")) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function runFmt(
  targetPath: string,
  options: FmtOptions
): Promise<void> {
  const useColor = !options.noColor && process.stdout.isTTY;
  const resolvedPath = path.resolve(targetPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(
      useColor
        ? chalk.red(`Error: Path does not exist: ${resolvedPath}`)
        : `Error: Path does not exist: ${resolvedPath}`
    );
    process.exit(1);
  }

  const spinner = ora({
    text: "Setting up luau-lsp...",
    isSilent: options.json,
    color: "cyan",
  }).start();

  let binaryPath: string;
  try {
    binaryPath = await ensureLuauLsp(spinner);
  } catch (err) {
    spinner.fail("Failed to get luau-lsp binary");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const files = collectLuauFiles(resolvedPath);
  if (files.length === 0) {
    spinner.warn("No .luau or .lua files found");
    return;
  }

  spinner.text = `${options.check ? "Checking format of" : "Formatting"} ${files.length} file${files.length === 1 ? "" : "s"}...`;

  const results: FmtResult[] = [];
  for (const file of files) {
    if (options.verbose && !options.json) {
      spinner.text = `${options.check ? "Checking" : "Formatting"} ${path.relative(process.cwd(), file)}...`;
    }
    const result = await formatFile(binaryPath, file, options.check, options.config);
    results.push(result);
  }

  spinner.stop();

  const errors = results.filter((r) => r.error);
  const changed = results.filter((r) => r.changed);
  const formatted = results.filter((r) => !r.changed && !r.error);
  const cwd = process.cwd();

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          results: results.map((r) => ({
            ...r,
            file: path.relative(cwd, r.file),
          })),
          summary: {
            total: files.length,
            formatted: formatted.length,
            changed: changed.length,
            errors: errors.length,
          },
        },
        null,
        2
      )
    );
    process.exit(changed.length > 0 || errors.length > 0 ? 1 : 0);
    return;
  }

  for (const r of errors) {
    const rel = path.relative(cwd, r.file);
    console.error(
      useColor
        ? chalk.red(`✗ ${rel}: ${r.error}`)
        : `ERROR ${rel}: ${r.error}`
    );
  }

  if (options.check) {
    for (const r of changed) {
      const rel = path.relative(cwd, r.file);
      console.log(
        useColor
          ? chalk.yellow(`  ${rel} — needs formatting`)
          : `  ${rel} — needs formatting`
      );
    }

    if (changed.length > 0) {
      console.log(
        useColor
          ? chalk.yellow(`\n${changed.length} file${changed.length === 1 ? "" : "s"} need formatting. Run 'luau-tools fmt' to fix.`)
          : `\n${changed.length} file(s) need formatting.`
      );
      process.exit(1);
    } else {
      console.log(
        useColor
          ? chalk.green(`✓ All ${files.length} file${files.length === 1 ? "" : "s"} are properly formatted`)
          : `All ${files.length} file(s) are properly formatted`
      );
    }
  } else {
    if (errors.length === 0) {
      console.log(
        useColor
          ? chalk.green(`✓ Formatted ${files.length} file${files.length === 1 ? "" : "s"}`)
          : `Formatted ${files.length} file(s)`
      );
    } else {
      console.log(
        `Formatted ${formatted.length} file(s) with ${errors.length} error(s)`
      );
      process.exit(1);
    }
  }
}
