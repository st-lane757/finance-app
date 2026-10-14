import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { COMPANY_SYMBOLS } from './config/companies';
import type { PriceSeries, TimeWindow } from './domain/types';
import { MarketError } from './services';
import type { MarketDataService } from './services';
import { MockMarketProvider } from './services/MockMarketProvider';

const mock = () => new MockMarketProvider(() => 1_700_000_000_000);

/** Wraps a service so selected calls can be overridden per test. */
function withOverrides(overrides: Partial<MarketDataService>): MarketDataService {
  const base = mock();
  return {
    getQuotes: (s) => base.getQuotes(s),
    getHistory: (s, w) => base.getHistory(s, w),
    ...overrides,
  };
}

describe('Day view (default)', () => {
  it('shows a quote card per tracked company and the intraday comparison', async () => {
    render(<App service={mock()} />);

    for (const symbol of COMPANY_SYMBOLS) {
      expect(await screen.findByLabelText(`${symbol} quote`)).toBeInTheDocument();
    }
    expect(await screen.findByText(/Relative performance — Current day/)).toBeInTheDocument();
    expect(await screen.findByTestId('comparison-line-chart')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /Change — Current day/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('IBM summary')).not.toBeInTheDocument();
  });
});

describe('Week view', () => {
  it('shows IBM headline stats and a ranking of all five companies', async () => {
    render(<App service={mock()} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));

    const summary = await screen.findByLabelText('IBM summary');
    expect(within(summary).getByText('Rank')).toBeInTheDocument();
    expect(within(summary).getByText('Vs peer average')).toBeInTheDocument();

    const table = await screen.findByRole('table', { name: /Change — Last 7 days/ });
    expect(within(table).getAllByRole('row')).toHaveLength(1 + COMPANY_SYMBOLS.length);
    expect(screen.queryByTestId('area-trend-chart')).not.toBeInTheDocument();
  });
});

describe('Quarter view', () => {
  it('adds the IBM price trend area chart', async () => {
    render(<App service={mock()} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));

    expect(await screen.findByLabelText('IBM summary')).toBeInTheDocument();
    expect(await screen.findByTestId('area-trend-chart')).toBeInTheDocument();
    expect(screen.getByText(/IBM price — Last quarter/)).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('exposes an accessible tab / tabpanel relationship and switches views', async () => {
    render(<App service={mock()} />);
    expect(screen.getByRole('tab', { name: 'Current day' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-day');

    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));
    expect(screen.getByRole('tab', { name: 'Last 7 days' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-week');
  });
});

describe('Failure handling', () => {
  it('shows error states with Retry when the whole service fails', async () => {
    const failing: MarketDataService = {
      getQuotes: () => Promise.reject(new MarketError('NETWORK', 'Network down')),
      getHistory: () => Promise.reject(new MarketError('NETWORK', 'Network down')),
    };
    render(<App service={failing} />);

    // Quotes and the comparison chart each fail independently.
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(2);
  });

  it('retry reloads data after a transient failure', async () => {
    let calls = 0;
    const flaky = withOverrides({
      getHistory: (symbol: string, window: TimeWindow): Promise<PriceSeries> => {
        calls++;
        return calls <= COMPANY_SYMBOLS.length
          ? Promise.reject(new MarketError('NETWORK', 'Network down'))
          : mock().getHistory(symbol, window);
      },
    });
    render(<App service={flaky} />);

    const chartAlert = await screen.findByText('Network down');
    expect(chartAlert).toBeInTheDocument();
    const retry = within(screen.getByLabelText(/Relative performance/)).getByRole('button', { name: 'Retry' });
    await userEvent.click(retry);

    expect(await screen.findByTestId('comparison-line-chart')).toBeInTheDocument();
  });

  it('renders the rest of the dashboard when one company fails and names the missing one', async () => {
    const partial = withOverrides({
      getHistory: (symbol: string, window: TimeWindow) =>
        symbol === 'SAP'
          ? Promise.reject(new MarketError('INVALID_SYMBOL', 'Symbol not found'))
          : mock().getHistory(symbol, window),
    });
    render(<App service={partial} />);

    expect(await screen.findByRole('note')).toHaveTextContent('Data unavailable for: SAP');
    const table = screen.getByRole('table', { name: /Change — Current day/ });
    expect(within(table).getAllByRole('row')).toHaveLength(1 + COMPANY_SYMBOLS.length - 1);
  });

  it('shows the empty state when no company has enough points', async () => {
    const sparse = withOverrides({
      getHistory: (symbol: string, window: TimeWindow): Promise<PriceSeries> =>
        Promise.resolve({ symbol, window, points: [{ t: 1, close: 1 }] }),
    });
    render(<App service={sparse} />);
    expect(await screen.findByText('No data available.')).toBeInTheDocument();
  });

  it('keeps quote cards usable when only history fails', async () => {
    const histFail = withOverrides({
      getHistory: () => Promise.reject(new MarketError('UPSTREAM', 'History down')),
    });
    render(<App service={histFail} />);

    expect(await screen.findByLabelText('IBM quote')).toBeInTheDocument();
    expect(await screen.findByText('History down')).toBeInTheDocument();
  });
});

describe('SymbolPicker + SelectedCompanySection (AC7 regression + new feature)', () => {
  it('AC7: existing dashboards are unchanged after entering a symbol', async () => {
    render(<App service={mock()} />);

    // Existing quote cards and comparison chart are present
    for (const symbol of COMPANY_SYMBOLS) {
      expect(await screen.findByLabelText(`${symbol} quote`)).toBeInTheDocument();
    }
    expect(screen.getByRole('table', { name: /Change — Current day/ })).toBeInTheDocument();

    // Submit a symbol via the picker
    await userEvent.type(screen.getByRole('textbox'), 'AAPL');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));

    // Existing dashboards still fully present
    for (const symbol of COMPANY_SYMBOLS) {
      expect(screen.getByLabelText(`${symbol} quote`)).toBeInTheDocument();
    }
    expect(screen.getByRole('table', { name: /Change — Current day/ })).toBeInTheDocument();
  });

  it('shows the new chart card after a valid symbol is submitted', async () => {
    render(<App service={mock()} />);
    await userEvent.type(screen.getByRole('textbox'), 'IBM');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));

    // ChartCard labelled with the symbol appears
    expect(await screen.findByLabelText('IBM price')).toBeInTheDocument();
    expect(await screen.findByTestId('area-trend-chart')).toBeInTheDocument();
  });

  it('shows a clear no-data message for an unknown symbol (INVALID_SYMBOL)', async () => {
    const withBadSymbol = withOverrides({
      getHistory: (symbol: string, window: TimeWindow): Promise<PriceSeries> =>
        symbol === 'ZZZZ'
          ? Promise.reject(new MarketError('INVALID_SYMBOL', 'Symbol not found'))
          : mock().getHistory(symbol, window),
    });
    render(<App service={withBadSymbol} />);

    await userEvent.type(screen.getByRole('textbox'), 'ZZZZ');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));

    expect(await screen.findByText('"ZZZZ" is not a recognised ticker symbol.')).toBeInTheDocument();
  });

  it('shows a network error message and a Retry button when the service fails', async () => {
    const withNetErr = withOverrides({
      getHistory: (symbol: string, window: TimeWindow): Promise<PriceSeries> =>
        symbol === 'TSLA'
          ? Promise.reject(new MarketError('NETWORK', 'Network down'))
          : mock().getHistory(symbol, window),
    });
    render(<App service={withNetErr} />);

    await userEvent.type(screen.getByRole('textbox'), 'TSLA');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));

    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(within(screen.getByLabelText('TSLA price')).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows a no-data message when the symbol resolves but has no usable points', async () => {
    const sparse = withOverrides({
      getHistory: (symbol: string, window: TimeWindow): Promise<PriceSeries> =>
        symbol === 'EMPTY'
          ? Promise.resolve({ symbol, window, points: [{ t: 1, close: 1 }] })
          : mock().getHistory(symbol, window),
    });
    render(<App service={sparse} />);

    await userEvent.type(screen.getByRole('textbox'), 'EMPTY');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));

    expect(await screen.findByText('No price data is available for "EMPTY".')).toBeInTheDocument();
  });

  it('updates the chart when a new symbol is submitted', async () => {
    render(<App service={mock()} />);

    await userEvent.type(screen.getByRole('textbox'), 'IBM');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));
    expect(await screen.findByLabelText('IBM price')).toBeInTheDocument();

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'MSFT');
    await userEvent.click(screen.getByRole('button', { name: 'Add chart' }));
    expect(await screen.findByLabelText('MSFT price')).toBeInTheDocument();
    expect(screen.queryByLabelText('IBM price')).not.toBeInTheDocument();
  });
});

