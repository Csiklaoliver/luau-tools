# luau-tools

[![VS Code Installs](https://img.shields.io/visual-studio-marketplace/i/csiklaoliver.luau-tools?color=blue&style=flat-square&label=VS%20Code%20installs)](https://marketplace.visualstudio.com/items?itemName=csiklaoliver.luau-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Full Luau developer experience — outside of Roblox Studio. Includes luau-lsp + Rojo in one install.**

<!-- demo gif here -->

Luau is Roblox's typed, high-performance superset of Lua 5.1. `luau-tools` wraps the battle-tested [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) language server and bundles [Rojo](https://github.com/rojo-rbx/rojo) to give you first-class type checking, autocomplete, diagnostics, and real-time Studio sync — all from VS Code, no manual setup required.

---

## Install

Search **"Luau Tools"** in the VS Code Extensions panel, or:

```
ext install csiklaoliver.luau-tools
```

That's it. Open a `.luau` file and the language server starts automatically.

---

## Features

**Language server (luau-lsp)**
- Autocomplete with full type awareness
- Real-time error and warning diagnostics
- Go-to-definition, find all references, rename symbol
- Hover documentation
- Strict/nonstrict/nocheck modes via `.luaurc`

**Syntax highlighting**
- Luau type annotations: `string`, `number`, generics `<T>`, unions `A | B`, intersections `A & B`
- `typeof()`, type casting `::Type`, string interpolation `` `{expr}` ``
- Luau keywords: `type`, `export`, `continue`

**Rojo integration**
- Bundled Rojo binary — no separate install
- Auto-updates to the latest Rojo release on every start
- Start/stop/restart from the command palette or status bar
- Status bar shows current Rojo version and sync state

**Cross-platform** — Windows x64, macOS arm64, macOS x64, Linux x64

---

## Rojo Workflow

1. Open your project folder in VS Code
2. Run **`Luau: Init Rojo Project`** to scaffold `default.project.json` and a `src/` layout
3. Install the [Rojo plugin](https://www.roblox.com/library/13916111411) in Roblox Studio
4. Run **`Luau: Start Rojo Sync`** — Rojo connects and syncs automatically
5. Edit your scripts in VS Code — changes appear in Studio instantly

```
Write Luau in VS Code
  → luau-lsp catches type errors in real time
    → Rojo syncs changes to Studio instantly
      → never touch Studio's script editor again
```

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type **Luau**:

| Command | Description |
|---|---|
| `Luau: Restart Language Server` | Restart the luau-lsp process |
| `Luau: Show Output` | Open the luau-lsp output channel |
| `Luau: Update luau-lsp` | Download the latest luau-lsp binary |
| `Luau: Start Rojo Sync` | Start Rojo (downloads/updates first if needed) |
| `Luau: Stop Rojo Sync` | Stop the running Rojo process |
| `Luau: Restart Rojo Sync` | Restart Rojo |
| `Luau: Init Rojo Project` | Scaffold `default.project.json` + `src/` layout |
| `Luau: Show Rojo Output` | Open the Rojo output channel |
| `Luau: Update Rojo` | Force download the latest Rojo binary |

---

## Settings

**Language server**

| Setting | Default | Description |
|---|---|---|
| `luau-tools.luauVersion` | `"latest"` | luau-lsp version to use |
| `luau-tools.lspPath` | `""` | Path to a custom luau-lsp binary |
| `luau-tools.diagnosticsEnabled` | `true` | Enable or disable real-time diagnostics |
| `luau-tools.completion.enabled` | `true` | Enable or disable autocomplete |

**Rojo**

| Setting | Default | Description |
|---|---|---|
| `luau-tools.rojo.enabled` | `true` | Enable or disable Rojo integration entirely |
| `luau-tools.rojo.autoStart` | `false` | Start Rojo automatically when a workspace opens |
| `luau-tools.rojo.autoUpdate` | `true` | Check for and download the latest Rojo release on start |
| `luau-tools.rojo.port` | `34872` | Port used by `rojo serve` |
| `luau-tools.rojo.rojoPath` | `""` | Path to a custom Rojo binary |
| `luau-tools.rojo.projectFile` | `"default.project.json"` | Rojo project file to use |

---

## .luaurc

Place a `.luaurc` in your project root to configure type checking:

```json
{
  "languageMode": "strict",
  "lint": {
    "UnusedVariable": "warning",
    "UnreachableCode": "error"
  },
  "aliases": {
    "@src": "./src"
  }
}
```

| Field | Values | Description |
|---|---|---|
| `languageMode` | `strict` \| `nonstrict` \| `nocheck` | Type checking strictness |
| `lint.*` | `"warning"` \| `"error"` \| `"disabled"` | Per-rule severity |
| `aliases` | `{ "@name": "./path" }` | Module path aliases |

---

## Not using Roblox?

That's fine — Luau works great as a standalone scripting language. You don't need Rojo or Studio at all. Just install the extension and open any `.luau` or `.lua` file.

Luau can be run outside Roblox using [lune](https://github.com/lune-org/lune), a runtime with file I/O, HTTP, processes, and more:

```bash
cargo install lune
lune run src/main.luau
```

---

## Comparison

| Feature | luau-tools | luau-lsp alone | Basic Lua LSP |
|---|---|---|---|
| Syntax highlighting | ✅ | ✅ | ✅ |
| Luau type annotations & generics | ✅ | ✅ | ❌ |
| Full LSP (autocomplete, go-to-def) | ✅ | ✅ | Partial |
| Studio sync (Rojo) | ✅ | ❌ | ❌ |
| Auto-download & auto-update | ✅ | ❌ | ❌ |
| Single install | ✅ | ❌ | ❌ |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

---

## Credits

- [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) by [JohnnyMorganz](https://github.com/JohnnyMorganz) — the language server powering type checking and autocomplete
- [Rojo](https://github.com/rojo-rbx/rojo) by [rojo-rbx](https://github.com/rojo-rbx) — the sync tool bridging VS Code and Roblox Studio
- [Luau](https://github.com/luau-lang/luau) — the language itself, open-sourced by Roblox

---

## License

MIT © [csiklaoliver](https://github.com/csiklaoliver)
