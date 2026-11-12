// Pricing rule for every product imported from a supplier:
//   supplier cost below KES 1,000   ->  sold at cost + a flat KES 120 profit
//   supplier cost KES 1,000 or more ->  sold at cost + 13%
// It is fixed (not chosen per import) so every product follows the same rule.
export const MARKUP_PERCENT = 13;
export const FLAT_PROFIT_KES = 120;
export const FLAT_PROFIT_BELOW_KES = 1000;

/** Selling price (whole KES) for a supplier cost. */
export const sellPriceFor = (cost: number): number =>
  cost < FLAT_PROFIT_BELOW_KES ? Math.round(cost + FLAT_PROFIT_KES) : Math.round(cost * (1 + MARKUP_PERCENT / 100));
