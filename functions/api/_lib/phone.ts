// Kenyan phone number normalization, shared by registration, login and the
// forgot-password flow so the same number always resolves to the same
// account no matter how a customer happened to type it in
// (0712345678 / +254712345678 / 254 712 345 678 all mean the same thing).

// Canonical storage format: E.164, e.g. "+254712345678". Used both as the
// `users.phone_number` value and as the "To" number for the WhatsApp API.
export function normalizeKenyanPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+254${digits.slice(1)}`;
  }
  // Bare 9-digit local number without the leading 0, e.g. "712345678"
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    return `+254${digits}`;
  }

  return null;
}
