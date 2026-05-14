import type { CurrencyCode } from '../types';

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  COP: 'es-CO',
  USD: 'en-US',
};

const MAX_FRACTION_DIGITS_BY_CURRENCY: Record<CurrencyCode, number> = {
  COP: 0,
  USD: 2,
};

export function formatLifePlanCurrency(value: number, currencyCode: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currencyCode], {
    currency: currencyCode,
    maximumFractionDigits: MAX_FRACTION_DIGITS_BY_CURRENCY[currencyCode],
    minimumFractionDigits: currencyCode === 'USD' ? 2 : 0,
    style: 'currency',
  }).format(value);
}
