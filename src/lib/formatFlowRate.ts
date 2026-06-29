import { formatEther } from "viem";

const SECONDS_PER_DAY = 86400n;

/**
 * Format a per-second wei flow rate as a human-readable per-day amount.
 * Shared by the edge labels (`CustomEdge`) and the diagram stats overlay so
 * both render flow rates identically.
 */
export function formatFlowRatePerDay(flowRate: bigint, symbol: string): string {
  const flowRatePerDay = flowRate * SECONDS_PER_DAY;
  return `${formatEther(flowRatePerDay)} ${symbol}/day`;
}
