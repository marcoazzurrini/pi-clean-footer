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
- Keep context usage on the left and model, thinking level, and allowed extension statuses on the right.
- Keep the `mcp` extension status hidden unless the project requirements explicitly change.
- Unsubscribe from `footerData.onBranchChange` through the component's `dispose` method.

## Packaging and development

- Keep the single-extension package flat and `package.json#pi.extensions` pointed at `./index.ts`.
- Do not edit a Pi-managed clone under `~/.pi/agent/git/`; edit this repository and push commits.
- Do not copy this extension back into `~/.pi/agent/extensions/` after installing the Git package, because that would load duplicate copies.
- Do not commit `node_modules`, logs, or generated package archives.
- Validate JSON, the Pi manifest target, and `git diff --check` before committing.
