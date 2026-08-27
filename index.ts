/**
 * Clean Footer Extension
 *
 * Blanks the startup header and replaces the footer with a single line:
 *   LEFT:  permission mode (from @georgedong32/permission-modes, when installed)
 *          + model name (no provider prefix) + thinking level
 *   RIGHT: context usage, color-coded
 *
 * The permission mode is read lazily at render time. The primary source is
 * the PERMISSION_MODES_INHERITED_MODE env var that permission-modes
 * publishes at session_start and on every mode change (shift+tab, /mode),
 * which covers the initial mode before any `modes` session entry exists.
 * The last `modes` custom session entry is used as a fallback when the env
 * var is not set. No direct coupling to permission-modes internals.
 *
 * Removes: pwd, git branch, token counts, cost, MCP status, model profile,
 * provider name, and the startup header.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

type Mode = "ask" | "plan" | "auto" | "bypass";

// Mirrors MODE_META in @georgedong32/permission-modes.
const MODE_META: Record<Mode, { icon: string; label: string; role: "muted" | "accent" | "warning" | "error" }> = {
	ask: { icon: "●", label: "Ask", role: "muted" },
	plan: { icon: "⏸", label: "Plan", role: "accent" },
	auto: { icon: "▶", label: "Auto", role: "warning" },
	bypass: { icon: "⚡", label: "Bypass", role: "error" },
};

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	return `${(count / 1000000).toFixed(1)}M`;
}

/** Current permission-modes mode, if determinable (env var first, session entry fallback). */
function getPermissionMode(ctx: ExtensionContext): Mode | null {
	// permission-modes publishes the live mode into process env at every
	// session_start and on every mode change; it is always fresh in the
	// interactive parent process where the footer renders.
	const envMode = process.env["PERMISSION_MODES_INHERITED_MODE"]?.trim();
	if (envMode && MODE_META[envMode as Mode]) return envMode as Mode;

	// Fallback: last persisted `modes` custom entry on the current branch.
	// (Not written until the first mode change of a session.)
	try {
		const branch = ctx.sessionManager.getBranch();
		for (let i = branch.length - 1; i >= 0; i--) {
			const entry = branch[i] as any;
			if (entry?.type === "custom" && entry?.customType === "modes" && entry?.data?.currentMode) {
				const mode = entry.data.currentMode as Mode;
				if (MODE_META[mode]) return mode;
			}
		}
	} catch {
		/* ignore */
	}
	return null;
}

/** Model display name without provider prefix ("Z.ai: Foo" / "zai/foo" -> "Foo"). */
function modelDisplayName(ctx: ExtensionContext): string {
	const model: any = ctx.model;
	if (!model) return "no-model";
	if (model.name) {
		const name = String(model.name);
		const idx = name.indexOf(":");
		return idx >= 0 && idx < name.length - 1 ? name.slice(idx + 1).trim() : name;
	}
	const id = String(model.id ?? "no-model");
	const slash = id.indexOf("/");
	return slash >= 0 ? id.slice(slash + 1) : id;
}

export default function cleanFooter(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		// setHeader(undefined) restores Pi's built-in header, so an empty render
		// is the only way to suppress the header entirely.
		ctx.ui.setHeader(() => ({ render: () => [] }));

		ctx.ui.setFooter((_tui, theme, _footerData) => {
			return {
				dispose() {},
				invalidate() {},
				render(width: number): string[] {
					// Left: permission mode (if permission-modes is present)
					let left = "";
					const mode = getPermissionMode(ctx);
					if (mode && MODE_META[mode]) {
						const m = MODE_META[mode];
						left += theme.fg(m.role, `${m.icon} ${m.label}`) + " • ";
					}

					// Left: model + thinking level
					const modelDisplay = modelDisplayName(ctx);
					const modelText = ctx.model?.reasoning
						? `${modelDisplay} • ${pi.getThinkingLevel()}`
						: modelDisplay;
					left += theme.fg("dim", modelText);

					// Right: context usage — tokens used / window total, no percentage;
					// color-coded by absolute usage: green below 150k, yellow at/above.
					const contextUsage = ctx.getContextUsage();
					const tokensUsed = contextUsage?.tokens ?? 0;
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextDisplay = `${formatTokens(tokensUsed)}/${formatTokens(contextWindow)}`;
					const right = theme.fg(tokensUsed < 150000 ? "success" : "warning", contextDisplay);

					// Layout: [left] ...padding... [right]
					const leftWidth = visibleWidth(left);
					const rightWidth = visibleWidth(right);
					const totalNeeded = leftWidth + 2 + rightWidth;

					let line: string;
					if (totalNeeded <= width) {
						const padding = " ".repeat(width - leftWidth - rightWidth);
						line = left + padding + right;
					} else {
						line = truncateToWidth(left + "  " + right, width);
					}

					return [line];
				},
			};
		});
	});
}
