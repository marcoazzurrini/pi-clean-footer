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
- Preserve ANSI-aware width calculations with `visibleWidth` and `truncateToWidth`.
- Keep the permission mode, model name, and thinking level on the left, and context usage on the right. Do not render the cwd, model profile, provider prefix, or extension statuses.
- The extension intentionally supersedes the footer installed by `@georgedong32/permission-modes`; keep it installed after that package in `settings.json#packages` so its `setFooter` call wins.
- Read the permission mode lazily inside `render()` from the last `modes` custom session entry (`customType: "modes"`) on the current branch — permission-modes appends it on every mode change. Omit the mode segment gracefully when no entry exists.
- Strip the provider prefix from the model display name (e.g. `Z.ai: GLM 5.3 Flash` renders as `GLM 5.3 Flash`).

## Packaging and development

- Keep the single-extension package flat and `package.json#pi.extensions` pointed at `./index.ts`.
- Do not edit a Pi-managed clone under `~/.pi/agent/git/`; edit this repository and push commits.
- Do not copy this extension back into `~/.pi/agent/extensions/` after installing the Git package, because that would load duplicate copies.
- Do not commit `node_modules`, logs, or generated package archives.
- Validate JSON, the Pi manifest target, and `git diff --check` before committing.
