# Pi Clean Footer

A small [Pi coding agent](https://pi.dev) extension that replaces the default footer with a minimal, single-line display and hides the startup header.

## What it shows

- **Left:** context usage as a percentage and the model's context-window size.
- **Right:** active model, reasoning level when applicable, and statuses published by other extensions.
- Context usage becomes a warning above 70% and an error above 90%.
- The `mcp` status is intentionally hidden.

The extension omits the working directory, Git branch, cumulative token counts, cost, and MCP status. Those values are either available elsewhere in the author's terminal setup or not useful for this workflow.

## Startup header

The extension also blanks the startup header shown above the chat, including the banner that `@companion-ai/feynman` installs. Because Pi keeps a single last-writer-wins header slot and runs `session_start` handlers in package order, this package must be listed **last** in `settings.json#packages`:

```json
"packages": [
  "npm:@georgedong32/permission-modes",
  "npm:@companion-ai/feynman",
  "git:github.com/marcoazzurrini/pi-clean-footer@main"
]
```

Listed earlier, another package's header or footer will override this one.

## Installation

Install the unpinned Git source to follow the repository's default branch:

```bash
pi install git:github.com/marcoazzurrini/pi-clean-footer
```

Check installed packages:

```bash
pi list
```

When Pi reports that package updates are available, update Git-backed extensions with:

```bash
pi update --extensions
```

Pinning the install to a tag or commit with `@ref` disables notifications for newer commits, so the unpinned form above is intentional.

> This repository is prepared for installation, but its initial repository setup does not install it into the author's Pi configuration.

## Package structure

```text
.
├── index.ts       # Extension source of truth
├── AGENTS.md      # Maintenance guidance for coding agents
├── package.json   # Pi package manifest
└── README.md
```

Pi reads `package.json#pi.extensions` and loads the TypeScript source directly; no build step is required. This package targets the `@earendil-works/pi-coding-agent` distribution and uses its corresponding `@earendil-works/pi-tui` helpers.

## Local development

For a temporary source-file test without adding the package to settings:

```bash
pi -e ./index.ts
```

Before committing, validate the package metadata and whitespace:

```bash
node -e 'const p=require("./package.json"); if (p.pi.extensions[0] !== "./index.ts") process.exit(1)'
git diff --check
```

Do not edit Pi's managed checkout under `~/.pi/agent/git/`. Make changes in this repository, commit them, push them, and then run `pi update --extensions`.

Do not also place a copy under `~/.pi/agent/extensions/` after installing this package. Pi would discover both copies and the duplicate footer registrations could conflict.

## License

[MIT](LICENSE)
