## Summary
Initial delivery of the finance dashboard: a React app that tracks IBM,
Microsoft, Oracle, SAP and Salesforce, with dashboards for the current day,
last 7 days and last quarter. Market data comes from Yahoo Finance through a
small Node proxy, or from a deterministic mock for offline demos.

**Dashboards**
| Tab | Content |
|---|---|
| Current day | Quote card per company, intraday comparison chart, ranking table |
| Last 7 days | IBM headline cards (change, rank, gap to peer average), comparison chart, ranking |
| Last quarter | Same as 7 days, plus an IBM price area chart (low / high / last) |

Comparison charts rebase every company to 100 at the window start. If one
company's data fails, the rest still render and a note names the missing symbol.

**Architecture**
- UI depends only on a `MarketDataService` interface (mock and HTTP providers)
- `server/` is an Express proxy: input validation, TTL cache with stale
  fallback, Yahoo payload normalization. Only `server/yahooClient.ts` imports
  `yahoo-finance2`
- Layers: `domain`, `config`, `services`, `state`, `analytics`, `components`,
  `pages`. Recharts is imported only by the two chart components

## Motivation
Starting point for the Bob GitHub SDLC lab (Part 1). Keeping the data source
behind an interface means the UI and analytics stay stable if the provider
changes, and the app works offline on the mock.

## Change Type
- [x] Initial application delivery
- [ ] Dashboard enhancement
- [x] Data integration update
- [x] Test / validation improvement
- [x] GitHub workflow improvement

## Bob Collaboration Notes
- **Repository analysis:** reviewed the workshop docs, CI and PR template, then
  proposed the architecture before writing code
- **Implementation:** scaffold, Yahoo proxy, three dashboards, tests
- **Validation:** lint, typecheck, tests, coverage and build; live proxy check
  against Yahoo; `npm ci` + validate on a clean copy of the committed tree
- **Diff review:** found and fixed series misaligned by index (now merged by
  timestamp), companies silently dropped on failure (now noted in the UI), CI
  running at the wrong directory, a local MCP token file that must not be
  committed, doubled company names on quote cards, a 24-hour "day" window in the
  mock, and repeated date labels on the 7-day axis

## Validation
```bash
cd finance-app
npm ci                  # Node 22+
npm run validate        # lint + typecheck + test + build
npm run test:coverage   # thresholds: 85% lines/functions, 75% branches
```
Success: every command exits 0; 64 tests pass; coverage is about 95% lines and
92% branches; the build succeeds (a bundle-size warning of about 548 kB is
expected).

Live data check (needs network): run `npm run dev:server`, then in another
terminal `npm run dev:live`, and open http://localhost:5173. Expect five quote
cards, charts on all three tabs, and a Retry button instead of a blank page if
you stop the proxy.

## Feature Request Alignment
Not tied to an issue. This is the baseline for the Part 2 request "Add a graph
for a user-selected company". The extension points are the company list in
`src/config/companies.ts`, `MarketDataService.getHistory(symbol, window)`, and
the per-card loading and error handling in `ChartCard`.

## Screenshots / Demo Notes
All three tabs on mock data: [attach current day, last 7 days, last quarter].
Retake the 7-day shot, since it predates the axis-label fix. A live-data
screenshot is still to be added.

## Risks / Follow-Up
- Yahoo's API is unofficial and may change or rate-limit. The proxy caches and
  serves stale data, but there is no automatic fallback to the mock; an outage
  shows an error state with Retry
- Requires Node 22+ (`yahoo-finance2` v4)
- `npm audit` reports 4 issues (2 critical) in Vitest test tooling only;
  production dependencies are clean. Fixing needs a major upgrade, proposed as
  a separate PR
- Bundle is about 548 kB (Recharts); consider code-splitting
- The `bob-feature-flow` CI job only prints guidance
- CI has not yet run on GitHub; its steps were verified locally on a clean copy
- Not yet checked in a browser: the new 7-day axis labels, the IBM area chart
  and live-data mode
- Optional: issue templates and branch protection on `main`
