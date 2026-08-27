# Repository guidance

## Purpose

This repository contains one Pi coding-agent package: the `clean-footer` extension. Its source of truth is `index.ts`.

## Compatibility

- Target the `@earendil-works/pi-coding-agent` distribution.
- Import Pi host APIs from `@earendil-works/pi-coding-agent` and TUI helpers from `@earendil-works/pi-tui`.
- Keep host-provided Pi packages in `peerDependencies` with a `"*"` range. Do not bundle them.
- Pi loads the TypeScript source directly; do not introduce a compilation step unless the packaging strategy is intentionally changed.

## Behavioral constraints

- Keep the footer to one line.
- Blank the startup header with `setHeader` using a component whose `render()` returns `[]`. Passing `undefined` restores Pi's built-in header instead of removing it.
- Preserve ANSI-aware width calculations with `visibleWidth` and `truncateToWidth`.
- Keep the permission mode, model name, and thinking level on the left, and context usage on the right. Context usage is `tokensUsed/contextWindow` with no percentage, colored `success` (green) below 150k tokens used and `warning` (yellow) at or above. Do not render the cwd, model profile, provider prefix, or extension statuses.
- The extension intentionally supersedes the footer installed by `@georgedong32/permission-modes` and the startup header installed by `@companion-ai/feynman`. Keep it **last** in `settings.json#packages` so both its `setFooter` and `setHeader` calls win: the extension runner awaits `session_start` handlers sequentially in package order, and each of `setFooter`/`setHeader` is a single last-writer-wins slot.
- Read the permission mode lazily inside `render()`, preferring the `PERMISSION_MODES_INHERITED_MODE` env var (published by permission-modes at `session_start` and on every mode change — this covers the initial mode before any `modes` session entry exists), with the last `modes` custom session entry (`customType: "modes"`) on the current branch as fallback. Omit the mode segment gracefully when neither source yields a mode.
- Strip the provider prefix from the model display name (e.g. `Z.ai: GLM 5.3 Flash` renders as `GLM 5.3 Flash`).

## Packaging and development

- Keep the single-extension package flat and `package.json#pi.extensions` pointed at `./index.ts`.
- Do not edit a Pi-managed clone under `~/.pi/agent/git/`; edit this repository and push commits.
- Do not copy this extension back into `~/.pi/agent/extensions/` after installing the Git package, because that would load duplicate copies.
- Do not commit `node_modules`, logs, or generated package archives.
- Validate JSON, the Pi manifest target, and `git diff --check` before committing.
