/**
 * Cookie sarlavhasidan bitta qiymatni o'qiydi.
 *
 * ⚠️ Bu yerda REGEX ISHLATILMAYDI — ataylab. Oldin
 *   new RegExp(`(?:^|;\s*)${name}=([^;]+)`)
 * ishlatilardi va shablon satridagi teskari chiziq yo'qolib,
 * regex `(?:^|;s*)` ga aylanib qolgandi: ya'ni `;` dan keyin harfiy
 * `s` talab qilinardi. Natijada admin_session birinchi cookie
 * bo'lmaganda topilmasdi va admin paneli brauzerda 401 olardi.
 */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const pair = part.trim();
    const eq = pair.indexOf("=");
    if (eq < 1) continue;
    if (pair.slice(0, eq) !== name) continue;
    // Qiymat ichida ham `=` bo'lishi mumkin — birinchisidan keyingi hammasi.
    return pair.slice(eq + 1);
  }
  return undefined;
}
