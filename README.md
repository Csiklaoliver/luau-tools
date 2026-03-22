# luau-tools

[![VS Code Installs](https://img.shields.io/visual-studio-marketplace/i/csiklaoliver.luau-tools?color=blue&style=flat-square&label=installs)](https://marketplace.visualstudio.com/items?itemName=csiklaoliver.luau-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Write Roblox games in VS Code. Full Luau type checking, autocomplete, and live Studio sync — all in one install.**

<!-- demo gif here -->

---

## What is this?

`luau-tools` is a VS Code extension that gives you a proper Luau development environment outside of Roblox Studio. It bundles two tools:

- **[luau-lsp](https://github.com/JohnnyMorganz/luau-lsp)** — type checking, autocomplete, go-to-definition, diagnostics
- **[Rojo](https://github.com/rojo-rbx/rojo)** — syncs your files to Roblox Studio in real time

Both binaries are downloaded and kept up to date automatically. No manual setup required.

---

## Install

Search **"Luau Tools"** in the VS Code Extensions panel, or run:

```
ext install csiklaoliver.luau-tools
```

That's it. Open a `.luau` file and the language server starts. Open a Rojo project and sync to Studio with one command.

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
    → Rojo syncs to Studio on every save
      → never open Studio's script editor again
```

---

## Features

**Language server (luau-lsp)**
- Autocomplete with full type awareness
- Real-time error and warning diagnostics
- Go-to-definition, find all references, rename symbol
- Hover documentation
- Support for `.luaurc` strict/nonstrict/nocheck modes

**Syntax highlighting**
- Luau type annotations: `string`, `number`, generics `<T>`, unions `A | B`
- `typeof()`, type casting `::Type`, string interpolation `` `{expr}` ``
- Luau keywords: `type`, `export`, `continue`

**Rojo integration**
- Bundled Rojo binary — no separate install
- Auto-updates to the latest Rojo release on every start
- Start/stop/restart from the command palette or the status bar
- Status bar shows current Rojo version and connection state

**Cross-platform** — Windows x64, macOS arm64, macOS x64, Linux x64

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type **Luau**:

| Command | Description |
|---|---|
| `Luau: Start Rojo Sync` | Start Rojo (downloads/updates first if needed) |
| `Luau: Stop Rojo Sync` | Stop the running Rojo process |
| `Luau: Restart Rojo Sync` | Restart Rojo |
| `Luau: Init Rojo Project` | Scaffold `default.project.json` + `src/` layout |
| `Luau: Show Rojo Output` | Open the Rojo output channel |
| `Luau: Update Rojo` | Force download the latest Rojo binary |
| `Luau: Restart Language Server` | Restart the luau-lsp process |
| `Luau: Show Output` | Open the luau-lsp output channel |
| `Luau: Update luau-lsp` | Download the latest luau-lsp binary |

---

## Settings

**Rojo**

| Setting | Default | Description |
|---|---|---|
| `luau-tools.rojo.autoUpdate` | `true` | Check for and download the latest Rojo release each time Rojo starts. Disable to pin your version or if you manage Rojo yourself. |
| `luau-tools.rojo.enabled` | `true` | Enable or disable Rojo integration entirely |
| `luau-tools.rojo.autoStart` | `false` | Start Rojo automatically when a workspace opens |
| `luau-tools.rojo.port` | `34872` | Port used by `rojo serve` |
| `luau-tools.rojo.rojoPath` | `""` | Path to a custom Rojo binary. Leave empty to use the auto-managed one. |
| `luau-tools.rojo.projectFile` | `"default.project.json"` | Rojo project file to use |

**Language server**

| Setting | Default | Description |
|---|---|---|
| `luau-tools.luauVersion` | `"latest"` | luau-lsp version to use |
| `luau-tools.lspPath` | `""` | Path to a custom luau-lsp binary |
| `luau-tools.diagnosticsEnabled` | `true` | Enable or disable real-time diagnostics |
| `luau-tools.completion.enabled` | `true` | Enable or disable autocomplete |

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

## Not a Roblox developer?

That's fine — Luau is just a language. You don't need Roblox Studio or Rojo to use it.

Luau is a fast, typed superset of Lua 5.1 that works great as a standalone scripting language. If you write Lua for game engines, embedded systems, config files, automation, or anything else — you get the same benefits:

**What do people actually use Lua/Luau for outside Roblox?**

Lua has been a popular embedded scripting language for decades. You'll find it in:

- **Game engines** — [LÖVE2D](https://love2d.org/), [Defold](https://defold.com/), [Solar2D](https://solar2d.com/), and many indie engines use Lua as their scripting layer
- **Game modding** — World of Warcraft addons, Factorio mods, Garry's Mod, and many moddable games expose a Lua API
- **Neovim** — the entire Neovim plugin ecosystem is written in Lua. If you write Neovim config or plugins, this extension helps.
- **Embedded scripting** — Lua is tiny (~200KB) and fast, making it the go-to choice for scripting inside C/C++ applications
- **Web servers** — [OpenResty](https://openresty.org/) (Lua on nginx) and [Kong](https://konghq.com/) use Lua for high-performance request handling
- **Automation and tools** — scripts, build pipelines, config-as-code, anything where you want a lightweight scripted layer
- **Learning** — Lua is one of the cleanest languages to learn programming fundamentals. Luau adds types so you can grow into larger projects.

Luau specifically (vs plain Lua) adds gradual typing, better performance, and safer semantics — making it viable for serious projects that plain Lua struggles with at scale.

- **Syntax highlighting** for `.luau` and `.lua` files
- **Autocomplete and type inference** — works on any Luau/Lua code, no Roblox context needed
- **Real-time error diagnostics** as you type
- **Strict mode** (`"languageMode": "strict"` in `.luaurc`) for full type safety
- **Zero Roblox setup** — just install the extension and open a file

You can completely ignore the Rojo section. Just write `.luau` files and the language server handles the rest.

**Running Luau outside Roblox**

Luau can be run standalone using [lune](https://github.com/lune-org/lune), a Luau runtime that gives you file I/O, HTTP, processes, and more:

```bash
# Install lune
cargo install lune
# or via aftman / rokit

# Run a script
lune run src/main.luau
```

Lune is the recommended way to use Luau as a general-purpose scripting language.

---

## vs. installing tools manually

| | luau-tools | Rojo alone | luau-lsp alone |
|---|---|---|---|
| Syntax highlighting | ✅ | ❌ | ✅ |
| Type checking + autocomplete | ✅ | ❌ | ✅ |
| Studio sync | ✅ | ✅ | ❌ |
| Auto-download & auto-update | ✅ | ❌ | ❌ |
| Single install | ✅ | ❌ | ❌ |

---

## Credits

- [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) by [JohnnyMorganz](https://github.com/JohnnyMorganz)
- [Rojo](https://github.com/rojo-rbx/rojo) by [rojo-rbx](https://github.com/rojo-rbx)
- [Luau](https://github.com/luau-lang/luau) by Roblox

---

## License

MIT © [csiklaoliver](https://github.com/csiklaoliver)
