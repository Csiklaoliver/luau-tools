# Contributing to luau-tools

Thank you for your interest in contributing! This guide will help you get started.

## Project Structure

```
luau-tools/
├── vscode-extension/   # VS Code extension
├── cli/                # CLI tool (npm: luau-tools)
├── .github/workflows/  # CI/CD
└── package.json        # npm workspaces root
```

## Prerequisites

- Node.js >= 18
- npm >= 9
- VS Code (for extension development)
- Git

## Development Setup

```bash
# Clone the repository
git clone https://github.com/csiklaoliver/luau-tools.git
cd luau-tools

# Install all workspace dependencies
npm install

# Build everything
npm run build
```

### VS Code Extension

```bash
cd vscode-extension
npm install
npm run build

# To launch an Extension Development Host:
# Open vscode-extension/ in VS Code
# Press F5 (or Run > Start Debugging)
```

### CLI

```bash
cd cli
npm install
npm run build

# Test the CLI locally
node dist/index.js --help

# Or link it globally
npm link
luau-tools --help
```

## Code Style

- TypeScript strict mode throughout — no implicit `any`
- 2-space indentation
- Prefer `const` over `let`; avoid `var`
- Descriptive variable names; avoid abbreviations
- All public APIs must have JSDoc comments

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for .luaurc aliases
fix: handle missing binary gracefully on Windows
docs: update CLI usage examples
chore: bump luau-lsp to 1.32.0
```

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes with tests where applicable
3. Run `npm run build` and ensure there are no TypeScript errors
4. Submit a PR with a clear description of the change and why

## Reporting Issues

Please use [GitHub Issues](https://github.com/csiklaoliver/luau-tools/issues) and include:
- OS and version
- Node.js version (`node --version`)
- VS Code version (if applicable)
- Steps to reproduce
- Expected vs actual behavior

## Release Process

Releases are automated via GitHub Actions. A new release is triggered by pushing a version tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

This publishes the CLI to npm and the extension to the VS Code Marketplace automatically.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
