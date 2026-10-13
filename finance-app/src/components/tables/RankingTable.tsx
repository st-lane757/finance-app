import type { RankedChange } from '../../analytics/metrics';

export function RankingTable({ rows, caption }: { rows: readonly RankedChange[]; caption: string }) {
  return (
    <table className="ranking">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Symbol</th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.symbol}>
            <td>{i + 1}</td>
            <td>{r.symbol}</td>
            <td>
              {r.pct >= 0 ? '+' : ''}
              {r.pct.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
