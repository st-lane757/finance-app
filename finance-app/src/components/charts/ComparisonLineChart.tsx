import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComparisonRow } from '../../analytics/metrics';
import type { Company } from '../../domain/types';

interface Props {
  data: ComparisonRow[];
  companies: readonly Company[];
  /** Formats the x-axis tick from an epoch-ms timestamp. */
  formatTick: (t: number) => string;
}

/** Thin wrapper around Recharts so the rest of the app never imports it directly. */
export function ComparisonLineChart({ data, companies, formatTick }: Props) {
  return (
    <div className="chart-box" data-testid="comparison-line-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={formatTick} minTickGap={32} />
          <YAxis domain={['auto', 'auto']} width={48} />
          <Tooltip labelFormatter={(t) => formatTick(Number(t))} />
          <Legend />
          {companies.map((c) => (
            <Line
              key={c.symbol}
              type="monotone"
              dataKey={c.symbol}
              name={c.name}
              stroke={c.color}
              dot={false}
              strokeWidth={c.symbol === 'IBM' ? 3 : 1.5}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
