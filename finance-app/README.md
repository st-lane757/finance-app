# Finance App

React + TypeScript + Vite market dashboard for IBM and up to four competitors.
Data comes from Yahoo Finance through a small Node proxy, or from a deterministic mock for offline demos.

## Commands

```bash
npm install
npm run dev          # UI on http://localhost:5173 with mock data (no network)
npm run dev:server   # Yahoo Finance proxy on http://localhost:8787
npm run dev:live     # UI using the proxy (run dev:server in another terminal)
npm run validate     # lint + typecheck + test + build
npm run test:coverage  # tests with coverage thresholds (85% lines/functions, 75% branches)
```

## Views

| Tab | Content |
|---|---|
| Current day | Quote card per company (price, change, % change), intraday comparison chart, ranking |
| Last 7 days | IBM headline cards (change, rank, gap to peer average), comparison chart, ranking |
| Last quarter | Same as 7 days, plus an IBM absolute-price area chart with low / high / last |

Comparison charts rebase every company to 100 at the start of the window. If one company's data
fails to load, the others still render and a note names the missing symbol.

## What success looks like

`npm run validate` exits 0 with no lint errors or warnings, no type errors, all tests passing and a
successful production build. `npm run test:coverage` meets its thresholds.

Manual check (optional, needs network): run `npm run dev:server` and `npm run dev:live`, then confirm
five quote cards, all three tabs rendering charts, and a Retry button appearing if you stop the proxy.

## Tests

| Location | Covers |
|---|---|
| `src/analytics/` | Percent change, rebasing, timestamp merge, ranking, stats, IBM vs peers |
| `src/components/` | Quote and stat cards, ChartCard states and error boundary, tabs, ranking table |
| `src/App.test.tsx` | Each view end to end on the mock provider, tab accessibility, whole-service failure, retry, partial failure, empty data |
| `src/services/` | Mock and HTTP providers, error mapping, provider factory |
| `server/` | Routes, input validation, caching and stale fallback, Yahoo payload normalization |

Requires Node 22+ (`yahoo-finance2` v4).

## Data flow

```
React UI -> MarketDataService -> HttpMarketProvider -> /api (Vite proxy) -> server/ (Express, cache) -> yahoo-finance2
                              \-> MockMarketProvider (default)
```

Proxy endpoints (`server/app.ts`):

- `GET /api/quotes?symbols=IBM,MSFT` returns `{ quotes: Quote[] }` (max 10 symbols; failing symbols are skipped).
- `GET /api/history?symbol=IBM&window=day|week|quarter` returns a `PriceSeries`.
- Errors are `{ error: { code, message } }` with 400 (bad input), 404 (unknown symbol) or 502 (provider down).
- Responses are cached in memory (30 s quotes, 1-15 min history); stale entries are served if Yahoo fails.

## Layout

| Path | Responsibility |
|---|---|
| `src/domain/` | Shared types (`Quote`, `PriceSeries`, `TimeWindow`) |
| `src/config/` | Tracked companies and time-window definitions |
| `src/services/` | `MarketDataService` interface, mock and HTTP providers, error types |
| `server/` | Express proxy: validation, TTL cache, Yahoo normalization. Only `yahooClient.ts` imports `yahoo-finance2` |
| `src/state/` | Service context and data hooks (`useQuotes`, `useHistories`) |
| `src/analytics/` | Pure functions: percent change, rebasing, ranking |
| `src/components/` | Presentational components (cards, charts, tables, feedback, layout) |
| `src/pages/` | `DashboardPage` – the only place that calls data hooks |

## Extension points

- **Add a company:** edit `src/config/companies.ts` (max 5) and, for the mock provider, `BASE_PRICES`.
- **Add a time window:** edit `src/config/timeWindows.ts` and the `TimeWindow` type.
- **Swap the data source:** implement `MarketDataService` and return it from `createMarketDataService()` in `src/services/index.ts`.
- **Swap the chart library:** only `src/components/charts/ComparisonLineChart.tsx` imports Recharts.
