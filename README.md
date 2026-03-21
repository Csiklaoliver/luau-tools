# luau-tools

[![npm version](https://img.shields.io/npm/v/luau-tools?color=crimson&style=flat-square)](https://www.npmjs.com/package/luau-tools)
[![VS Code Installs](https://img.shields.io/visual-studio-marketplace/i/csiklaoliver.luau-tools?color=blue&style=flat-square&label=VS%20Code%20installs)](https://marketplace.visualstudio.com/items?itemName=csiklaoliver.luau-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Discord](https://img.shields.io/discord/1234567890?color=7289da&label=discord&style=flat-square)](https://discord.gg/luau-tools)

**Full Luau developer experience — outside of Roblox Studio.**

<!-- demo gif here -->

Luau is Roblox's typed, high-performance superset of Lua 5.1. `luau-tools` wraps the battle-tested [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) language server to give you first-class type checking, autocomplete, diagnostics, and formatting in VS Code and your terminal — no Roblox Studio required.

---

## Quick Install

### VS Code Extension
Search **"Luau Tools"** in the VS Code Extensions panel, or:
```
ext install csiklaoliver.luau-tools
```

### CLI (npm)
```bash
npm install -g luau-tools
# or
npx luau-tools --help
```

---

## Features

- **Syntax Highlighting** for `.luau` and `.lua` files
  - Full Luau type annotations: `string`, `number`, generics `<T>`, unions `A | B`, intersections `A & B`
  - `typeof()`, type casting `::Type`, string interpolation `` `{expr}` ``
  - Luau-exclusive keywords: `type`, `export`, `continue`
- **Language Server (LSP)** — powered by luau-lsp
  - Autocomplete with type-aware suggestions
  - Go-to-definition and find-all-references
  - Hover documentation
  - Real-time error diagnostics
  - Rename symbol across workspace
  - Document formatting
- **Auto-download** the correct `luau-lsp` binary for your OS (Windows x64, macOS arm64, macOS x64, Linux x64)
- **Status bar** showing LSP state (starting / running / error)
- **Type checking modes**: `strict`, `nonstrict`, `nocheck` via `.luaurc`
- **CLI commands**: `check`, `fmt`, `lint`, `init`, `run`, `version`, `update`
- Cross-platform: Windows, macOS, Linux

---

## VS Code Settings

| Setting | Default | Description |
|---|---|---|
| `luau-tools.luauVersion` | `"latest"` | luau-lsp version to use |
| `luau-tools.lspPath` | `""` | Path to a custom luau-lsp binary |
| `luau-tools.diagnosticsEnabled` | `true` | Enable/disable error diagnostics |
| `luau-tools.completion.enabled` | `true` | Enable/disable autocomplete |

## VS Code Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type **Luau**:

| Command | Description |
|---|---|
| `Luau: Restart Language Server` | Restart the luau-lsp process |
| `Luau: Show Output` | Open the Luau output channel |
| `Luau: Check Current File` | Run type checking on the active file |
| `Luau: Update luau-lsp` | Download the latest luau-lsp binary |

---

## CLI Usage

```bash
# Type-check a file or directory
luau-tools check src/

# Format Luau code
luau-tools fmt src/main.luau

# Lint with configurable rules
luau-tools lint src/

# Initialize a new Luau project
luau-tools init

# Run a Luau file (requires lute runtime)
luau-tools run src/main.luau

# Show versions
luau-tools version

# Update luau-lsp binary
luau-tools update
```

### Global Flags

```
--json          Output results as JSON
--no-color      Disable colored output
--config        Path to .luaurc config file
--verbose       Detailed output
```

---

## .luaurc Configuration

Place a `.luaurc` file in your project root:

```json
{
  "languageMode": "strict",
  "lint": {
    "UnusedVariable": "warning",
    "UnreachableCode": "error",
    "ImplicitReturn": "warning"
  },
  "aliases": {
    "@src": "./src"
  }
}
```

| Field | Values | Description |
|---|---|---|
| `languageMode` | `strict` \| `nonstrict` \| `nocheck` | Type checking strictness |
| `lint.*` | `"warning"` \| `"error"` \| `"disabled"` | Per-rule lint severity |
| `aliases` | `{ "@name": "./path" }` | Module path aliases |

---

## Comparison

| Feature | luau-tools | Roblox Studio | Basic Lua LSP |
|---|---|---|---|
| Works outside Roblox Studio | ✅ | ❌ | ✅ |
| Luau type annotations | ✅ | ✅ | ❌ |
| Generics & union types | ✅ | ✅ | ❌ |
| Full LSP (autocomplete, go-to-def) | ✅ | ✅ | Partial |
| CLI type checking | ✅ | ❌ | ❌ |
| Auto-updating binary | ✅ | N/A | ❌ |
| Cross-platform | ✅ | ❌ | ✅ |
| Open source | ✅ | ❌ | ✅ |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

---

## Credits

- [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) by [JohnnyMorganz](https://github.com/JohnnyMorganz) — the language server that powers everything. This project wraps and distributes it.
- [Luau](https://github.com/luau-lang/luau) — the language itself, open-sourced by Roblox.

---

## License

MIT © [csiklaoliver](https://github.com/csiklaoliver)
