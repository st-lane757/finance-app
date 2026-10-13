export type TimeWindow = 'day' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
  color: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  asOf: number;
}

export interface PricePoint {
  /** Epoch milliseconds. */
  t: number;
  close: number;
}

export interface PriceSeries {
  symbol: string;
  window: TimeWindow;
  points: PricePoint[];
}
