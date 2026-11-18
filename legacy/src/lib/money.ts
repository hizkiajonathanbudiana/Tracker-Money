import { CurrencyCode } from "@/types/economy";

export interface MoneyFormat {
  currencySymbol: string;
  locale: string;
  decimals: number;
}

export interface CurrencyPreset extends MoneyFormat {
  code: CurrencyCode;
  label: string;
}

export const CURRENCY_PRESETS: Record<CurrencyCode, CurrencyPreset> = {
  USD: {
    code: "USD",
    label: "US dollar ($)",
    currencySymbol: "$",
    locale: "en-US",
    decimals: 2,
  },
  IDR: {
    code: "IDR",
    label: "Rupiah (Rp)",
    currencySymbol: "Rp",
    locale: "id-ID",
    decimals: 0,
  },
  TWD: {
    code: "TWD",
    label: "Taiwan dollar (NT$)",
    currencySymbol: "NT$",
    locale: "zh-TW",
    decimals: 0,
  },
};

export const DEFAULT_MONEY_FORMAT: MoneyFormat = {
  currencySymbol: CURRENCY_PRESETS.USD.currencySymbol,
  locale: CURRENCY_PRESETS.USD.locale,
  decimals: CURRENCY_PRESETS.USD.decimals,
};

/**
 * Formats money with the user configured symbol/locale.
 * Kept dependency free so it can be used on the server and in plain helpers.
 */
export function formatMoney(amount: number, config?: Partial<MoneyFormat> | null): string {
  const symbol = config?.currencySymbol ?? DEFAULT_MONEY_FORMAT.currencySymbol;
  const locale = config?.locale ?? DEFAULT_MONEY_FORMAT.locale;
  const decimals = config?.decimals ?? DEFAULT_MONEY_FORMAT.decimals;
  const safe = Number.isFinite(amount) ? amount : 0;
  const digits = Math.max(0, Math.min(3, Math.trunc(decimals)));
  const body = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(safe);
  return `${symbol}${body}`;
}

/** Short form for chart axes: $1.2k / $940 */
export function formatMoneyShort(amount: number, config?: Partial<MoneyFormat> | null): string {
  const symbol = config?.currencySymbol ?? DEFAULT_MONEY_FORMAT.currencySymbol;
  const safe = Number.isFinite(amount) ? amount : 0;
  if (Math.abs(safe) >= 1000) {
    const thousands = safe / 1000;
    const body = Math.abs(thousands) >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
    return `${symbol}${body}k`;
  }
  return `${symbol}${Math.round(safe)}`;
}

export function formatPoints(points: number): string {
  const safe = Number.isFinite(points) ? Math.trunc(points) : 0;
  return `${new Intl.NumberFormat("en-US").format(safe)} pts`;
}

export function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${Math.round(safe)}%`;
}

/** Rounds to 2 decimals so float noise never reaches Firestore. */
export function roundMoney(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100;
}
