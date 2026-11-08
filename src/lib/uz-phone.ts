/** Null means overlong/foreign input: never truncate into another person's number. */
export function uzPhoneDigits(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00998")) digits = digits.slice(5);
  else if (digits.startsWith("998") && (digits.length >= 12 || /^\s*\+998/.test(value))) digits = digits.slice(3);
  return digits.length <= 9 ? digits : null;
}
export function formatUzPhone(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");
}
export const isUzPhone = (value: string) => /^998\d{9}$/.test(value);
