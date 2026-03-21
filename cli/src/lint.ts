import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import ora from "ora";
import { runCheck } from "./check.js";

export interface LintOptions {
  json: boolean;
  noColor: boolean;
  config?: string;
  verbose: boolean;
}

interface LuaurcConfig {
  lint?: Record<string, string>;
  languageMode?: string;
  aliases?: Record<string, string>;
}

function findLuaurc(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, ".luaurc");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadLuaurc(configPath: string): LuaurcConfig {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as LuaurcConfig;
  } catch {
    return {};
  }
}

export async function runLint(
  targetPath: string,
  options: LintOptions
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

  // Resolve config
  let configPath = options.config;
  if (!configPath) {
    const found = findLuaurc(
      fs.statSync(resolvedPath).isDirectory() ? resolvedPath : path.dirname(resolvedPath)
    );
    if (found) {
      configPath = found;
      if (options.verbose && !options.json) {
        const spinner = ora({ isSilent: true }).start();
        spinner.stop();
        console.log(
          useColor
            ? chalk.dim(`Using config: ${found}`)
            : `Using config: ${found}`
        );
      }
    }
  }

  if (configPath) {
    const config = loadLuaurc(configPath);
    const lintRules = config.lint ?? {};

    if (options.verbose && !options.json && Object.keys(lintRules).length > 0) {
      console.log(
        useColor
          ? chalk.dim(`Lint rules: ${JSON.stringify(lintRules)}`)
          : `Lint rules: ${JSON.stringify(lintRules)}`
      );
    }
  }

  // Lint runs type checking with luau-lsp which includes lint diagnostics
  // The .luaurc config is passed to control which lint rules are active
  await runCheck(resolvedPath, {
    json: options.json,
    noColor: options.noColor,
    config: configPath,
    verbose: options.verbose,
  });
}

export { findLuaurc, loadLuaurc };
