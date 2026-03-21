# luau-tools

[![npm version](https://img.shields.io/npm/v/luau-tools?color=crimson&style=flat-square)](https://www.npmjs.com/package/luau-tools)
[![VS Code Installs](https://img.shields.io/visual-studio-marketplace/i/csiklaoliver.luau-tools?color=blue&style=flat-square&label=VS%20Code%20installs)](https://marketplace.visualstudio.com/items?itemName=csiklaoliver.luau-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Discord](https://img.shields.io/discord/1234567890?color=7289da&label=discord&style=flat-square)](https://discord.gg/luau-tools)

**Full Luau developer experience — outside of Roblox Studio. Includes luau-lsp + Rojo in one install.**

<!-- demo gif here -->

Luau is Roblox's typed, high-performance superset of Lua 5.1. `luau-tools` wraps the battle-tested [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) language server and bundles [Rojo](https://github.com/rojo-rbx/rojo) to give you first-class type checking, autocomplete, diagnostics, formatting, and real-time Studio sync — all from VS Code, no Roblox Studio required for development.

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
- **Auto-download** the correct `luau-lsp` and `rojo` binaries for your OS (Windows x64, macOS arm64, macOS x64, Linux x64)
- **Rojo Integration** — sync files to Roblox Studio in real time (bundled, no separate install)
  - Start/stop/restart Rojo from the command palette or status bar
  - `luau-tools init` scaffolds a full Rojo project layout
  - Status bar item with quick-pick menu
- **Dual status bar**: `⬡ Luau` (LSP) + `⟳ Rojo` (sync) side by side
- **Type checking modes**: `strict`, `nonstrict`, `nocheck` via `.luaurc`
- **CLI commands**: `check`, `fmt`, `lint`, `init`, `run`, `version`, `update`
- Cross-platform: Windows, macOS, Linux

---

## 🔄 Rojo Integration

`luau-tools` includes Rojo out of the box — no separate installation needed.

### Setup

1. Open your Luau project in VS Code
2. Run **`Luau: Init Rojo Project`** from the command palette
3. Open Roblox Studio and enable the [Rojo plugin](https://www.roblox.com/library/13916111411)
4. Run **`Luau: Start Rojo Sync`** from the command palette
5. Edit your files — changes appear in Studio instantly

### The complete workflow

```
Write Luau in VS Code
  → luau-lsp catches type errors in real time
    → Rojo syncs changes to Studio instantly
      → never touch Studio's script editor again
```

### Rojo Commands

| Command | Description |
|---|---|
| `Luau: Start Rojo Sync` | Download Rojo (if needed) and start `rojo serve` |
| `Luau: Stop Rojo Sync` | Stop the Rojo process |
| `Luau: Restart Rojo Sync` | Restart Rojo |
| `Luau: Init Rojo Project` | Create `default.project.json` + source layout |
| `Luau: Show Rojo Output` | Open the Rojo output channel |
| `Luau: Update Rojo` | Download the latest Rojo binary |

### Rojo Settings

| Setting | Default | Description |
|---|---|---|
| `luau-tools.rojo.enabled` | `true` | Enable/disable Rojo integration |
| `luau-tools.rojo.autoStart` | `false` | Auto-start Rojo when workspace opens |
| `luau-tools.rojo.port` | `34872` | Port for `rojo serve` |
| `luau-tools.rojo.rojoPath` | `""` | Custom Rojo binary path |
| `luau-tools.rojo.projectFile` | `"default.project.json"` | Project file name |

### Comparison

| Feature | luau-tools | Rojo alone | luau-lsp alone |
|---|---|---|---|
| Syntax highlighting | ✅ | ❌ | ✅ |
| Type checking | ✅ | ❌ | ✅ |
| Studio sync | ✅ | ✅ | ❌ |
| One-click install | ✅ | ❌ | ❌ |
| CLI tools | ✅ | ❌ | ❌ |
| Auto binary download | ✅ | ❌ | ❌ |

---

## VS Code Settings

| Setting | Default | Description |
|---|---|---|
| `luau-tools.luauVersion` | `"latest"` | luau-lsp version to use |
| `luau-tools.lspPath` | `""` | Path to a custom luau-lsp binary |
| `luau-tools.diagnosticsEnabled` | `true` | Enable/disable error diagnostics |
| `luau-tools.completion.enabled` | `true` | Enable/disable autocomplete |
| `luau-tools.rojo.enabled` | `true` | Enable/disable Rojo integration |
| `luau-tools.rojo.autoStart` | `false` | Auto-start Rojo when workspace opens |
| `luau-tools.rojo.port` | `34872` | Rojo serve port |
| `luau-tools.rojo.rojoPath` | `""` | Path to a custom Rojo binary |
| `luau-tools.rojo.projectFile` | `"default.project.json"` | Rojo project file name |

## VS Code Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type **Luau**:

| Command | Description |
|---|---|
| `Luau: Restart Language Server` | Restart the luau-lsp process |
| `Luau: Show Output` | Open the Luau output channel |
| `Luau: Check Current File` | Run type checking on the active file |
| `Luau: Update luau-lsp` | Download the latest luau-lsp binary |
| `Luau: Start Rojo Sync` | Start Rojo serve |
| `Luau: Stop Rojo Sync` | Stop Rojo |
| `Luau: Restart Rojo Sync` | Restart Rojo |
| `Luau: Init Rojo Project` | Scaffold default.project.json + src/ layout |
| `Luau: Show Rojo Output` | Open the Rojo output channel |
| `Luau: Update Rojo` | Download the latest Rojo binary |

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
| Studio sync (Rojo) | ✅ | ✅ | ❌ |
| CLI type checking | ✅ | ❌ | ❌ |
| Auto-updating binaries | ✅ | N/A | ❌ |
| Cross-platform | ✅ | ❌ | ✅ |
| Open source | ✅ | ❌ | ✅ |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

---

## Credits

- [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) by [JohnnyMorganz](https://github.com/JohnnyMorganz) — the language server that powers type checking and autocomplete. This project wraps and distributes it.
- [Rojo](https://github.com/rojo-rbx/rojo) by [rojo-rbx](https://github.com/rojo-rbx) — the sync tool that bridges VS Code and Roblox Studio. This project bundles and distributes it.
- [Luau](https://github.com/luau-lang/luau) — the language itself, open-sourced by Roblox.

---

## License

MIT © [csiklaoliver](https://github.com/csiklaoliver)
