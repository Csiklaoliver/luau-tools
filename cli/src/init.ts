import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import ora from "ora";

export interface InitOptions {
  json: boolean;
  noColor: boolean;
  verbose: boolean;
}

const LUAURC_TEMPLATE = `{
  "languageMode": "strict",
  "lint": {
    "UnusedVariable": "warning",
    "UnreachableCode": "error",
    "ImplicitReturn": "warning",
    "LocalShadow": "warning",
    "ConfusingAndOr": "warning",
    "FormatString": "warning"
  },
  "aliases": {
    "@src": "./src"
  }
}
`;

const MAIN_LUAU_TEMPLATE = `-- Main entry point for your Luau project
-- See https://luau-lang.org for documentation

type Greeting = {
\tname: string,
\tmessage: string,
}

local function greet(greeting: Greeting): string
\treturn \`Hello, {greeting.name}! {greeting.message}\`
end

local myGreeting: Greeting = {
\tname = "World",
\tmessage = "Welcome to Luau!",
}

print(greet(myGreeting))
`;

const README_TEMPLATE = (projectName: string): string => `# ${projectName}

A Luau project.

## Development

\`\`\`bash
# Type check
luau-tools check src/

# Format
luau-tools fmt src/

# Lint
luau-tools lint src/
\`\`\`

## Configuration

See [\`.luaurc\`](.luaurc) for type checking and lint configuration.
`;

interface InitResult {
  projectDir: string;
  filesCreated: string[];
  skipped: string[];
}

export async function runInit(
  targetDir: string,
  options: InitOptions
): Promise<void> {
  const useColor = !options.noColor && process.stdout.isTTY;
  const projectDir = path.resolve(targetDir);
  const projectName = path.basename(projectDir);

  const spinner = ora({
    text: "Initializing Luau project...",
    isSilent: options.json,
    color: "cyan",
  }).start();

  const result: InitResult = {
    projectDir,
    filesCreated: [],
    skipped: [],
  };

  const filesToCreate: Array<{ relativePath: string; content: string }> = [
    { relativePath: ".luaurc", content: LUAURC_TEMPLATE },
    { relativePath: path.join("src", "main.luau"), content: MAIN_LUAU_TEMPLATE },
    { relativePath: "README.md", content: README_TEMPLATE(projectName) },
    {
      relativePath: ".gitignore",
      content: "# Luau build artifacts\n*.out\n\n# OS files\n.DS_Store\nThumbs.db\n",
    },
  ];

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });

  for (const file of filesToCreate) {
    const fullPath = path.join(projectDir, file.relativePath);

    if (fs.existsSync(fullPath)) {
      result.skipped.push(file.relativePath);
      if (options.verbose) {
        spinner.text = `Skipping ${file.relativePath} (already exists)`;
      }
      continue;
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, "utf-8");
    result.filesCreated.push(file.relativePath);
    spinner.text = `Created ${file.relativePath}`;
  }

  spinner.stop();

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const checkmark = useColor ? chalk.green("✓") : "✓";
  const skipMark = useColor ? chalk.dim("→") : "→";

  console.log(
    useColor
      ? chalk.bold(`\nInitialized Luau project in ${chalk.cyan(path.relative(process.cwd(), projectDir) || ".")}`)
      : `\nInitialized Luau project in ${path.relative(process.cwd(), projectDir) || "."}`
  );
  console.log("");

  for (const file of result.filesCreated) {
    console.log(`  ${checkmark} Created ${useColor ? chalk.cyan(file) : file}`);
  }

  for (const file of result.skipped) {
    console.log(`  ${skipMark} Skipped ${useColor ? chalk.dim(file) : file} (already exists)`);
  }

  console.log("");
  console.log("Next steps:");
  console.log(
    useColor
      ? `  ${chalk.cyan("cd")} ${path.relative(process.cwd(), projectDir) || "."}`
      : `  cd ${path.relative(process.cwd(), projectDir) || "."}`
  );
  console.log(
    useColor
      ? `  ${chalk.cyan("luau-tools check")} src/    ${chalk.dim("# type-check your code")}`
      : "  luau-tools check src/"
  );
  console.log(
    useColor
      ? `  ${chalk.cyan("luau-tools run")} src/main.luau  ${chalk.dim("# run your code")}`
      : "  luau-tools run src/main.luau"
  );
  console.log("");
}
