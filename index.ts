/**
 * Clean Footer Extension
 *
 * Replaces the footer with a single line:
 *   LEFT:  permission mode (from @georgedong32/permission-modes, when installed)
 *          + model name (no provider prefix) + thinking level
 *   RIGHT: context usage, color-coded
 *
 * The permission mode is read lazily from the `modes` custom session entries
 * that permission-modes appends on every mode change, so the footer picks up
 * shift+tab cycles on the next frame without any direct coupling.
 *
 * Removes: pwd, git branch, token counts, cost, MCP status, model profile,
 * provider name.
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

/** Last persisted permission-modes state on the current branch, if any. */
function getPermissionMode(ctx: ExtensionContext): Mode | null {
	try {
		const branch = ctx.sessionManager.getBranch();
		for (let i = branch.length - 1; i >= 0; i--) {
			const entry = branch[i] as any;
			if (entry?.type === "custom" && entry?.customType === "modes" && entry?.data?.currentMode) {
				return entry.data.currentMode as Mode;
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

					// Right: context usage (color-coded)
					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const percentValue = contextUsage?.percent ?? 0;
					const percentStr = contextUsage?.percent !== null ? `${percentValue.toFixed(1)}%` : "?";
					const contextDisplay = `${formatTokens(contextUsage?.tokens ?? 0)}/${formatTokens(contextWindow)} ${percentStr}`;

					let right: string;
					if (percentValue > 90) {
						right = theme.fg("error", contextDisplay);
					} else if (percentValue > 70) {
						right = theme.fg("warning", contextDisplay);
					} else {
						right = theme.fg("dim", contextDisplay);
					}

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
