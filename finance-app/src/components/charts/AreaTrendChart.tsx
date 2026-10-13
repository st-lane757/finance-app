import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint } from '../../domain/types';

interface Props {
  points: readonly PricePoint[];
  color: string;
  label: string;
  formatTick: (t: number) => string;
}

/** Absolute-price area chart for a single company. Only chart file besides ComparisonLineChart that imports Recharts. */
export function AreaTrendChart({ points, color, label, formatTick }: Props) {
  return (
    <div className="chart-box" data-testid="area-trend-chart" role="img" aria-label={`${label} price trend`}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={points as PricePoint[]} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={formatTick} minTickGap={32} />
          <YAxis domain={['auto', 'auto']} width={56} />
          <Tooltip labelFormatter={(t) => formatTick(Number(t))} />
          <Area type="monotone" dataKey="close" name={label} stroke={color} fill={color} fillOpacity={0.15} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
