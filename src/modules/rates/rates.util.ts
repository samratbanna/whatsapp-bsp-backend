import { BadRequestException } from '@nestjs/common';
import { WalletCategory } from '../wallet/schemas/wallet.schema';

export const CATEGORIES = Object.values(WalletCategory);

/** Paise per message per category; null = not for sale. */
export type Rates = Record<WalletCategory, number | null>;
export type Quantities = Partial<Record<WalletCategory, number>>;

export interface PricedItem {
  category: WalletCategory;
  quantity: number;
  ratePaise: number;
  amountPaise: number;
}

export const LABEL: Record<WalletCategory, string> = {
  transactional: 'Transactional',
  promotional: 'Promotional',
  authentication: 'Authentication',
};

export const emptyRates = (): Rates => ({
  transactional: null,
  promotional: null,
  authentication: null,
});

/** Plain object from a stored rate card (sub-document, lean object or nothing). */
export function readRates(card: any): Rates {
  const out = emptyRates();
  for (const c of CATEGORIES) {
    const v = card?.[c];
    out[c] = typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  return out;
}

/**
 * Quantity × rate per category. Rates carry up to two decimals of a paisa, so the product is
 * worked out in hundredths of a paisa and rounded once per line: 1000 × 13p = 13000p = ₹130.
 */
export function priceItems(rates: Rates, quantities: Quantities): PricedItem[] {
  const items: PricedItem[] = [];
  for (const category of CATEGORIES) {
    const quantity = quantities?.[category] ?? 0;
    if (!quantity) continue;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException(
        `${LABEL[category]} quantity must be a whole number`,
      );
    }
    const rate = rates[category];
    if (rate == null || rate <= 0) {
      throw new BadRequestException(
        `${LABEL[category]} messages are not available for purchase yet — no rate is set`,
      );
    }
    const amountPaise = Math.round((quantity * Math.round(rate * 100)) / 100);
    items.push({ category, quantity, ratePaise: rate, amountPaise });
  }
  if (!items.length)
    throw new BadRequestException('Enter how many messages you want to buy');
  return items;
}

export function totals(items: { amountPaise: number }[], gstPercent: number) {
  const subtotalPaise = items.reduce((s, i) => s + i.amountPaise, 0);
  const gstPaise = Math.round((subtotalPaise * gstPercent) / 100);
  return { subtotalPaise, gstPaise, totalPaise: subtotalPaise + gstPaise };
}

/** "1,000 transactional + 500 promotional" */
export function describeItems(
  items: { category: WalletCategory; quantity: number }[],
): string {
  return items
    .map((i) => `${i.quantity.toLocaleString('en-IN')} ${i.category}`)
    .join(' + ');
}

export const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
