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

const SERVER_MAIN_LUAU = `-- Server entry point
-- Runs in ServerScriptService/Server

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")

print("Server started!")
`;

const CLIENT_MAIN_LUAU = `-- Client entry point
-- Runs in StarterPlayer/StarterPlayerScripts/Client

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")

print("Client started!")
`;

const SHARED_INIT_LUAU = `-- Shared module — accessible from both server and client

local Shared = {}

export type Config = {
\tdebugMode: boolean,
}

Shared.config: Config = {
\tdebugMode = false,
}

return Shared
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

const buildDefaultProjectJson = (projectName: string): string =>
  JSON.stringify(
    {
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
    },
    null,
    2
  ) + "\n";

const README_TEMPLATE = (projectName: string): string => `# ${projectName}

A Luau project with Rojo sync support.

## Setup

1. Install the [Rojo VS Code extension](https://marketplace.visualstudio.com/items?itemName=csiklaoliver.luau-tools) (includes Rojo)
2. Open this folder in VS Code
3. Run **"Luau: Start Rojo Sync"** from the Command Palette
4. Open Roblox Studio and connect via the Rojo plugin

## CLI

\`\`\`bash
# Type check
luau-tools check src/

# Format
luau-tools fmt src/

# Lint
luau-tools lint src/

# Run a standalone Luau file
luau-tools run src/main.luau
\`\`\`

## Project Layout

\`\`\`
src/
  server/   → ServerScriptService/Server
  client/   → StarterPlayer/StarterPlayerScripts/Client
  shared/   → ReplicatedStorage/Shared
\`\`\`

## Configuration

- [\`.luaurc\`](.luaurc) — type checking and lint rules
- [\`default.project.json\`](default.project.json) — Rojo sync config
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
    {
      relativePath: "default.project.json",
      content: buildDefaultProjectJson(projectName),
    },
    {
      relativePath: path.join("src", "main.luau"),
      content: MAIN_LUAU_TEMPLATE,
    },
    {
      relativePath: path.join("src", "server", "init.server.luau"),
      content: SERVER_MAIN_LUAU,
    },
    {
      relativePath: path.join("src", "client", "init.client.luau"),
      content: CLIENT_MAIN_LUAU,
    },
    {
      relativePath: path.join("src", "shared", "init.luau"),
      content: SHARED_INIT_LUAU,
    },
    { relativePath: "README.md", content: README_TEMPLATE(projectName) },
    {
      relativePath: ".gitignore",
      content:
        "# Roblox build outputs\n*.rbxl\n*.rbxlx\n\n# Luau build artifacts\n*.out\n\n# OS files\n.DS_Store\nThumbs.db\n",
    },
  ];

  // Create all needed directories up front
  for (const subDir of ["src/server", "src/client", "src/shared"]) {
    fs.mkdirSync(path.join(projectDir, subDir), { recursive: true });
  }

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
    if (options.verbose) {
      spinner.text = `Created ${file.relativePath}`;
    }
  }

  spinner.stop();

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const checkmark = useColor ? chalk.green("✓") : "✓";
  const skipMark = useColor ? chalk.dim("→") : "→";
  const relDir = path.relative(process.cwd(), projectDir) || ".";

  console.log(
    useColor
      ? chalk.bold(`\nInitialized Luau + Rojo project in ${chalk.cyan(relDir)}`)
      : `\nInitialized Luau + Rojo project in ${relDir}`
  );
  console.log("");

  for (const file of result.filesCreated) {
    console.log(`  ${checkmark} ${useColor ? chalk.cyan(file) : file}`);
  }

  for (const file of result.skipped) {
    console.log(
      `  ${skipMark} ${useColor ? chalk.dim(file) : file} (skipped, already exists)`
    );
  }

  console.log("");
  console.log("Next steps:");

  const steps: Array<[string, string]> = [
    [`cd ${relDir}`, "enter the project"],
    ["luau-tools check src/", "type-check your code"],
    [
      "Luau: Start Rojo Sync",
      "sync to Roblox Studio (VS Code command palette)",
    ],
  ];

  for (const [cmd, desc] of steps) {
    if (useColor) {
      console.log(`  ${chalk.cyan(cmd)}  ${chalk.dim("# " + desc)}`);
    } else {
      console.log(`  ${cmd}  # ${desc}`);
    }
  }

  console.log("");
  if (useColor) {
    console.log(
      chalk.dim(
        "Tip: Open this folder in VS Code to get full Luau + Rojo IDE support."
      )
    );
  }
  console.log("");
}
