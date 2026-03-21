# Luau Tools for VS Code

Full Luau developer experience — outside of Roblox Studio.

## Features

- **Syntax Highlighting** — all Luau-specific syntax including type annotations, generics, unions, intersections, string interpolation
- **Language Server** — powered by [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp)
  - Autocomplete
  - Go-to-definition
  - Find all references
  - Hover documentation
  - Error diagnostics
  - Rename symbol
  - Document formatting
- **Auto-download** of the correct luau-lsp binary for your platform
- **Status bar** showing the current LSP state

## Requirements

- VS Code 1.85+
- Internet connection (for first-time binary download)

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `luau-tools.luauVersion` | `"latest"` | luau-lsp version |
| `luau-tools.lspPath` | `""` | Custom binary path |
| `luau-tools.diagnosticsEnabled` | `true` | Enable diagnostics |
| `luau-tools.completion.enabled` | `true` | Enable autocomplete |

## Commands

- `Luau: Restart Language Server`
- `Luau: Show Output`
- `Luau: Check Current File`
- `Luau: Update luau-lsp`

## More Info

See the [main README](https://github.com/csiklaoliver/luau-tools) for full documentation.
