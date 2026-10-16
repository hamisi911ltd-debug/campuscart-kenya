// Where CampusMart delivers. Delivery is within Nairobi and Mombasa only.
// Checkout offers just these, and the server rejects any other county
// (functions/api/checkout.ts keeps its own copy of this list - keep them in sync).
export const DELIVERY_COUNTIES = ["Nairobi", "Mombasa"] as const;

/** Shown wherever a shopper might wonder if we reach them. */
export const DELIVERY_NOTICE = "We deliver within Nairobi and Mombasa only.";

// Flat delivery fee (KES) charged on every order. Keep in sync with
// DELIVERY_FEE in functions/api/checkout.ts.
export const DELIVERY_FEE = 129;

export type DeliveryCounty = typeof DELIVERY_COUNTIES[number];

// Kenyan mobile numbers: 07xx / 01xx / +2547xx / +2541xx (10 digits local).
export const isValidKenyanPhone = (raw: string): boolean => {
  const digits = raw.replace(/\D/g, "");
  return (
    (digits.length === 10 && /^0[17]/.test(digits)) ||
    (digits.length === 12 && /^254[17]/.test(digits)) ||
    (digits.length === 9 && /^[17]/.test(digits))
  );
};
