// Pricing rule for every product imported from a supplier:
//   supplier cost above KES 500   ->  sold at cost + a flat KES 100 profit
//   supplier cost KES 500 or less ->  sold at cost + 13%
// Keep in sync with src/data/pricing.ts.
// It is fixed (not chosen per import) so every product follows the same rule.
export const MARKUP_PERCENT = 13;
export const FLAT_PROFIT_KES = 100;
export const FLAT_PROFIT_ABOVE_KES = 500;

/** Selling price (whole KES) for a supplier cost. */
export const sellPriceFor = (cost: number): number =>
  cost > FLAT_PROFIT_ABOVE_KES ? Math.round(cost + FLAT_PROFIT_KES) : Math.round(cost * (1 + MARKUP_PERCENT / 100));

/** The margin that rule works out to for a cost, as a percentage (for the stored record). */
export const effectiveMarkupPercent = (cost: number): number =>
  cost > 0 ? Math.round((sellPriceFor(cost) / cost - 1) * 1000) / 10 : MARKUP_PERCENT;
