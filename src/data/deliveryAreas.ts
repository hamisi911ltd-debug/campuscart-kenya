// Counties CampusMart delivers to. Orders are fulfilled through Kilimall /
// Jumia-style nationwide courier networks, so delivery is offered per county
// (with the customer giving the town/area and street or landmark).
//
// To stop delivering to a county, remove it here - checkout, the order
// record and the admin WhatsApp message all read from this one list.
export const DELIVERY_COUNTIES = [
  "Nairobi", "Mombasa", "Kiambu", "Kajiado", "Machakos", "Nakuru", "Kisumu", "Uasin Gishu",
  "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta",
  "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo",
  "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Makueni",
  "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a",
  "Turkana", "West Pokot", "Samburu", "Trans-Nzoia", "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia",
  "Narok", "Kericho", "Bomet",
  "Kakamega", "Vihiga", "Bungoma", "Busia",
  "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira",
] as const;

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
