/**
 * To'lov tizimlari belgilari — inline SVG.
 *
 * Tashqi rasm yuklanmaydi: sahifa tezroq ochiladi, CSP muammosi yo'q va
 * provayder saytida rasm o'chsa ham bizda buzilmaydi (Click kabinetidagi
 * logotip aynan shunday bo'sh qolib ketgan edi).
 *
 * `currentColor` ishlatilmaydi — brend ranglari o'zgarmasligi kerak.
 */

/** Click belgisi — ko'k "diafragma" shakli, o'rtasi kesilgan. */
export function ClickMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label="Click"
      className="shrink-0"
    >
      {/* Ikki burchagi o'tkir, ikkitasi yumaloq — Click belgisining shakli */}
      <path
        d="M20 2c9.94 0 18 8.06 18 18 0 9.94-8.06 18-18 18C10.06 38 2 29.94 2 20 2 10.06 10.06 2 20 2Z"
        fill="#0A6EFF"
      />
      <circle cx="20" cy="20" r="6.6" fill="#0B1220" />
    </svg>
  );
}

/** Click belgisi + "click" yozuvi. */
export function ClickLogo({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ClickMark size={size} />
      <span
        style={{ fontSize: size * 0.82, letterSpacing: "-0.02em" }}
        className="font-semibold leading-none"
      >
        click
      </span>
    </span>
  );
}

/** Uzum Nasiya belgisi — binafsha kvadrat, ichida "U". */
export function UzumMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label="Uzum Nasiya"
      className="shrink-0"
    >
      <rect x="0" y="0" width="40" height="40" rx="11" fill="#7000FF" />
      <path
        d="M13 11.5v10.2c0 3.9 3.1 6.8 7 6.8s7-2.9 7-6.8V11.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Uzum belgisi + "Uzum Nasiya" yozuvi. */
export function UzumLogo({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <UzumMark size={size} />
      <span
        style={{ fontSize: size * 0.72, letterSpacing: "-0.01em" }}
        className="font-semibold leading-none"
      >
        Uzum Nasiya
      </span>
    </span>
  );
}

/** Uzcard belgisi — matnli nishon. */
export function UzcardMark({ size = 18 }: { size?: number }) {
  return (
    <span
      style={{ fontSize: size * 0.62 }}
      className="inline-flex items-center rounded px-1.5 py-0.5 font-bold tracking-tight bg-[#0F3F8F] text-white leading-none"
    >
      UZCARD
    </span>
  );
}

/** Humo belgisi — matnli nishon. */
export function HumoMark({ size = 18 }: { size?: number }) {
  return (
    <span
      style={{ fontSize: size * 0.62 }}
      className="inline-flex items-center rounded px-1.5 py-0.5 font-bold tracking-tight bg-[#00A3E0] text-white leading-none"
    >
      HUMO
    </span>
  );
}
