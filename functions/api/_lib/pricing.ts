// Every product imported from a supplier is sold at its cost plus this markup.
// It's fixed (not chosen per import) so all products carry the same margin.
// Keep in sync with MARKUP_PERCENT in src/data/pricing.ts.
export const MARKUP_PERCENT = 10;

/** Selling price (whole KES) for a supplier cost. */
export const sellPriceFor = (cost: number): number => Math.round(cost * (1 + MARKUP_PERCENT / 100));
