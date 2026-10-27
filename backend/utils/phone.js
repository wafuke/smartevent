/**
 * Normalize Kenyan phone numbers to E.164 (+254XXXXXXXXX).
 * Returns null when the number cannot be a valid Kenyan mobile number.
 *   0712345678 / 0112345678 / 712345678 / 254712345678 / +254712345678 -> +254712345678
 */
function normalizeKenyanPhone(raw) {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim().replace(/[\s\-().]/g, '');
  if (!s) return null;
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('254')) s = s.slice(3);
  else if (s.startsWith('0')) s = s.slice(1);
  if (!/^[17]\d{8}$/.test(s)) return null;
  return `+254${s}`;
}

module.exports = { normalizeKenyanPhone };
