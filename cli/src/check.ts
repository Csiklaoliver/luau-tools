import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import ora from "ora";
import { ensureLuauLsp } from "./downloader.js";

const execFileAsync = promisify(execFile);

export interface CheckOptions {
  json: boolean;
  noColor: boolean;
  config?: string;
  verbose: boolean;
}

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

interface LuauLspOutput {
  diagnostics?: Array<{
    source: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    severity: number;
    code: string | number;
    message: string;
  }>;
  error?: string;
}

function severityFromCode(code: number): Diagnostic["severity"] {
  // LSP severity: 1=error, 2=warning, 3=info, 4=hint
  if (code === 1) return "error";
  if (code === 2) return "warning";
  return "info";
}

function formatDiagnostic(
  d: Diagnostic,
  useColor: boolean,
  relativeBase: string
): string {
  const relFile = path.relative(relativeBase, d.file) || d.file;
  const loc = `${relFile}:${d.line}:${d.column}`;

  let severity: string;
  if (useColor) {
    switch (d.severity) {
      case "error":
        severity = chalk.red("error");
        break;
      case "warning":
        severity = chalk.yellow("warning");
        break;
      default:
        severity = chalk.blue("info");
    }
  } else {
    severity = d.severity;
  }

  const code = d.code ? ` (${d.code})` : "";
  const filePart = useColor ? chalk.cyan(loc) : loc;
  return `${filePart}: ${severity}${code}: ${d.message}`;
}

async function runLuauLspCheck(
  binaryPath: string,
  targetPath: string,
  configPath?: string
): Promise<Diagnostic[]> {
  const args: string[] = ["analyze", "--formatter=json"];

  if (configPath) {
    args.push(`--settings=${configPath}`);
  }

  args.push(targetPath);

  let stdout = "";
  let stderr = "";

  try {
    const result = await execFileAsync(binaryPath, args, {
      maxBuffer: 50 * 1024 * 1024, // 50MB
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (err) {
    const execErr = err as { stdout?: string; stderr?: string; code?: number };
    // luau-lsp exits non-zero when there are errors — that's expected
    stdout = execErr.stdout ?? "";
    stderr = execErr.stderr ?? "";
  }

  if (stderr) {
    process.stderr.write(stderr + "\n");
  }

  const diagnostics: Diagnostic[] = [];

  // Parse JSON output from luau-lsp
  const lines = stdout.split("\n").filter((l) => l.trim().length > 0);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as LuauLspOutput;
      if (parsed.diagnostics) {
        for (const d of parsed.diagnostics) {
          diagnostics.push({
            file: path.resolve(d.source ?? targetPath),
            line: (d.range?.start?.line ?? 0) + 1,
            column: (d.range?.start?.character ?? 0) + 1,
            severity: severityFromCode(d.severity ?? 1),
            code: String(d.code ?? ""),
            message: d.message,
          });
        }
      }
    } catch {
      // Non-JSON line, skip
    }
  }

  return diagnostics;
}

export async function runCheck(
  targetPath: string,
  options: CheckOptions
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

  spinner.text = `Checking ${resolvedPath}...`;

  let diagnostics: Diagnostic[];
  try {
    diagnostics = await runLuauLspCheck(
      binaryPath,
      resolvedPath,
      options.config
    );
  } catch (err) {
    spinner.fail("Type checking failed");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  spinner.stop();

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          diagnostics,
          summary: {
            errors: errors.length,
            warnings: warnings.length,
            total: diagnostics.length,
          },
        },
        null,
        2
      )
    );
    process.exit(errors.length > 0 ? 1 : 0);
    return;
  }

  const cwd = process.cwd();

  if (diagnostics.length === 0) {
    console.log(
      useColor
        ? chalk.green("✓ No issues found")
        : "No issues found"
    );
    return;
  }

  for (const d of diagnostics) {
    console.log(formatDiagnostic(d, useColor, cwd));
  }

  console.log("");

  const errorStr = errors.length > 0
    ? (useColor ? chalk.red(`${errors.length} error${errors.length === 1 ? "" : "s"}`) : `${errors.length} error(s)`)
    : null;
  const warnStr = warnings.length > 0
    ? (useColor ? chalk.yellow(`${warnings.length} warning${warnings.length === 1 ? "" : "s"}`) : `${warnings.length} warning(s)`)
    : null;

  const parts = [errorStr, warnStr].filter(Boolean);
  console.log(`Found ${parts.join(", ")}`);

  process.exit(errors.length > 0 ? 1 : 0);
}
