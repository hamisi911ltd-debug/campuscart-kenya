// Pricing rule for every product imported from a supplier:
//   supplier cost above KES 500   ->  sold at cost + a flat KES 100 profit
//   supplier cost KES 500 or less ->  sold at cost + 13%
// Keep in sync with functions/api/_lib/pricing.ts.
// It is fixed (not chosen per import) so every product follows the same rule.
export const MARKUP_PERCENT = 13;
export const FLAT_PROFIT_KES = 100;
export const FLAT_PROFIT_ABOVE_KES = 500;

/** Selling price (whole KES) for a supplier cost. */
export const sellPriceFor = (cost: number): number =>
  cost > FLAT_PROFIT_ABOVE_KES ? Math.round(cost + FLAT_PROFIT_KES) : Math.round(cost * (1 + MARKUP_PERCENT / 100));
