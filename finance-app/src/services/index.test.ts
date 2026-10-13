import { describe, expect, it } from 'vitest';
import { HttpMarketProvider } from './HttpMarketProvider';
import { createMarketDataService } from './index';
import { MockMarketProvider } from './MockMarketProvider';

describe('createMarketDataService', () => {
  it('uses the HTTP provider when the data source is "http"', () => {
    expect(createMarketDataService('http')).toBeInstanceOf(HttpMarketProvider);
  });

  it('defaults to the mock provider', () => {
    expect(createMarketDataService(undefined)).toBeInstanceOf(MockMarketProvider);
    expect(createMarketDataService('mock')).toBeInstanceOf(MockMarketProvider);
  });
});
