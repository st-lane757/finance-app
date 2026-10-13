import type { Company } from '../domain/types';

/** Single source of truth for tracked companies: IBM plus up to four competitors. */
export const MAX_COMPANIES = 5;

/** The company the dashboard is about; peers are compared against it. */
export const FOCUS_SYMBOL = 'IBM';

export const COMPANIES: readonly Company[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe' },
  { symbol: 'MSFT', name: 'Microsoft', color: '#198038' },
  { symbol: 'ORCL', name: 'Oracle', color: '#da1e28' },
  { symbol: 'SAP', name: 'SAP', color: '#8a3ffc' },
  { symbol: 'CRM', name: 'Salesforce', color: '#b28600' },
].slice(0, MAX_COMPANIES);

export const COMPANY_SYMBOLS: readonly string[] = COMPANIES.map((c) => c.symbol);
