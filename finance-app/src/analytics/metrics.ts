import type { PriceSeries } from '../domain/types';

const round2 = (n: number) => Number(n.toFixed(2));

/** Percent change from first to last point; 0 for series with < 2 points. */
export function pctChange(series: PriceSeries): number {
  const { points } = series;
  if (points.length < 2 || points[0].close === 0) return 0;
  return ((points[points.length - 1].close - points[0].close) / points[0].close) * 100;
}

export interface ComparisonRow {
  t: number;
  [symbol: string]: number;
}

/**
 * Rebases every series to 100 at its first point and merges them on timestamp,
 * so companies with different price levels and sampling share one axis.
 * Timestamps that only some series have yield sparse rows (charts connect gaps).
 */
export function toComparisonData(seriesList: readonly PriceSeries[]): ComparisonRow[] {
  const rows = new Map<number, ComparisonRow>();
  for (const s of seriesList) {
    const base = s.points[0]?.close;
    if (!base) continue;
    for (const p of s.points) {
      const row = rows.get(p.t) ?? { t: p.t };
      row[s.symbol] = round2((p.close / base) * 100);
      rows.set(p.t, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

export interface RankedChange {
  symbol: string;
  pct: number;
}

export function rankByChange(seriesList: readonly PriceSeries[]): RankedChange[] {
  return seriesList
    .map((s) => ({ symbol: s.symbol, pct: round2(pctChange(s)) }))
    .sort((a, b) => b.pct - a.pct);
}

export interface SeriesStats {
  symbol: string;
  pct: number;
  high: number;
  low: number;
  last: number;
}

/** Summary of one series, or undefined when it has no points. */
export function seriesStats(series: PriceSeries): SeriesStats | undefined {
  if (series.points.length === 0) return undefined;
  const closes = series.points.map((p) => p.close);
  return {
    symbol: series.symbol,
    pct: round2(pctChange(series)),
    high: Math.max(...closes),
    low: Math.min(...closes),
    last: closes[closes.length - 1],
  };
}

export interface FocusComparison {
  symbol: string;
  pct: number;
  /** 1-based position in the ranking, best performer first. */
  rank: number;
  total: number;
  /** Average % change of all other companies; undefined when there are none. */
  peerAverage?: number;
  /** pct minus peerAverage, in percentage points. */
  delta?: number;
}

/** How the focus company (IBM) performed relative to its peers; undefined if it has no data. */
export function focusVsPeers(
  ranked: readonly RankedChange[],
  focus: string,
): FocusComparison | undefined {
  const index = ranked.findIndex((r) => r.symbol === focus);
  if (index === -1) return undefined;
  const peers = ranked.filter((r) => r.symbol !== focus);
  const base = { symbol: focus, pct: ranked[index].pct, rank: index + 1, total: ranked.length };
  if (peers.length === 0) return base;
  const peerAverage = round2(peers.reduce((sum, r) => sum + r.pct, 0) / peers.length);
  return { ...base, peerAverage, delta: round2(base.pct - peerAverage) };
}
