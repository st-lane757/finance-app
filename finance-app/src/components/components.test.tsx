import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuoteCard } from './cards/QuoteCard';
import { FocusStats } from './cards/FocusStats';
import { ChartCard } from './charts/ChartCard';
import { TimeWindowTabs } from './layout/TimeWindowTabs';
import { RankingTable } from './tables/RankingTable';

describe('QuoteCard', () => {
  const quote = { symbol: 'IBM', name: 'IBM', price: 230, change: -1.5, changePct: -0.65, currency: 'USD', asOf: 0 };

  it('shows price and signed change, styled by direction', () => {
    render(<QuoteCard quote={quote} />);
    expect(screen.getByText('-1.50 (-0.65%)')).toBeInTheDocument();
    expect(screen.getByLabelText('IBM quote')).toHaveClass('down');
  });

  it('shows the company name only when it differs from the symbol', () => {
    const { rerender } = render(<QuoteCard quote={quote} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(/^IBM$/);
    rerender(<QuoteCard quote={{ ...quote, symbol: 'MSFT', name: 'Microsoft' }} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('MSFT Microsoft');
  });

  it('prefixes positive changes with +', () => {
    render(<QuoteCard quote={{ ...quote, change: 2, changePct: 1 }} />);
    expect(screen.getByText('+2.00 (+1.00%)')).toBeInTheDocument();
    expect(screen.getByLabelText('IBM quote')).toHaveClass('up');
  });
});

describe('FocusStats', () => {
  it('renders change, rank and gap to peers', () => {
    render(
      <FocusStats
        focus={{ symbol: 'IBM', pct: 2, rank: 2, total: 5, peerAverage: 0.5, delta: 1.5 }}
        periodLabel="Last 7 days"
      />,
    );
    expect(screen.getByText('+2.00%')).toBeInTheDocument();
    expect(screen.getByText('2 of 5')).toBeInTheDocument();
    expect(screen.getByText('+1.50 pts')).toBeInTheDocument();
    expect(screen.getByText('peers +0.50%')).toBeInTheDocument();
  });

  it('hides the peer card when there are no peers', () => {
    render(<FocusStats focus={{ symbol: 'IBM', pct: -1, rank: 1, total: 1 }} periodLabel="x" />);
    expect(screen.queryByText('Vs peer average')).not.toBeInTheDocument();
    expect(screen.getByText('-1.00%')).toBeInTheDocument();
  });
});

describe('ChartCard', () => {
  it('shows loading', () => {
    render(<ChartCard title="T" status="loading">content</ChartCard>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the error message and calls onRetry', async () => {
    const onRetry = vi.fn();
    render(<ChartCard title="T" status="error" errorMessage="Boom" onRetry={onRetry}>content</ChartCard>);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty state instead of children when isEmpty', () => {
    render(<ChartCard title="T" status="success" isEmpty>content</ChartCard>);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders children on success', () => {
    render(<ChartCard title="T" subtitle="sub" status="success">content</ChartCard>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('sub')).toBeInTheDocument();
  });

  it('contains render errors in a boundary', () => {
    const Bomb = () => {
      throw new Error('render fail');
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ChartCard title="T" status="success"><Bomb /></ChartCard>);
    expect(screen.getByRole('alert')).toHaveTextContent('This section failed to render.');
    spy.mockRestore();
  });
});

describe('TimeWindowTabs', () => {
  it('marks the active tab and reports changes', async () => {
    const onChange = vi.fn();
    render(<TimeWindowTabs value="week" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Last 7 days' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));
    expect(onChange).toHaveBeenCalledWith('quarter');
  });
});

describe('RankingTable', () => {
  it('lists rows in order with signed percentages', () => {
    render(<RankingTable caption="Change" rows={[{ symbol: 'A', pct: 3 }, { symbol: 'B', pct: -1.5 }]} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('1A+3.00%');
    expect(rows[1]).toHaveTextContent('2B-1.50%');
  });
});
