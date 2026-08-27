/**
 * Clean Footer Extension
 *
 * Replaces the default pi footer with a minimal single-line footer.
 * Shows only: context usage (color-coded) + model/thinking level.
 *
 * Removes: pwd, git branch, token counts, cost, MCP status.
 * These are either redundant (tmux shows pwd/branch) or irrelevant (subscription).
 *
 * Also picks up extension statuses (like preset badge) and shows them on the right.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	return `${(count / 1000000).toFixed(1)}M`;
}

export default function cleanFooter(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsub,
				invalidate() {},
				render(width: number): string[] {
					// Context usage (color-coded)
					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const percentValue = contextUsage?.percent ?? 0;
					const percentStr = contextUsage?.percent !== null ? `${percentValue.toFixed(1)}%` : "?";
					const contextDisplay = `${percentStr}/${formatTokens(contextWindow)}`;

					let contextStyled: string;
					if (percentValue > 90) {
						contextStyled = theme.fg("error", contextDisplay);
					} else if (percentValue > 70) {
						contextStyled = theme.fg("warning", contextDisplay);
					} else {
						contextStyled = theme.fg("dim", contextDisplay);
					}

					// Model + thinking level
					const modelName = ctx.model?.id || "no-model";
					let modelDisplay = modelName;
					if (ctx.model?.reasoning) {
						const thinking = pi.getThinkingLevel();
						modelDisplay = thinking === "off" ? `${modelName} • thinking off` : `${modelName} • ${thinking}`;
					}

					// Extension statuses (e.g., preset badge) — sorted, with blocklist
					const BLOCKED_STATUSES = new Set(["mcp"]);
					const statuses = footerData.getExtensionStatuses();
					let statusStr = "";
					if (statuses.size > 0) {
						const filtered = Array.from(statuses.entries())
							.filter(([key]) => !BLOCKED_STATUSES.has(key))
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([, text]) => text);
						if (filtered.length > 0) {
							statusStr = "  " + filtered.join(" ");
						}
					}

					// Layout: [context]  ...padding...  [model • thinking]  [statuses]
					const left = contextStyled;
					const right = theme.fg("dim", modelDisplay) + statusStr;

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
