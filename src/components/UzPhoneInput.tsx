"use client";
import { formatUzPhone, uzPhoneDigits } from "@/lib/uz-phone";

export default function UzPhoneInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const digits = value.startsWith("998") ? value.slice(3) : uzPhoneDigits(value) ?? "";
  return <div className="field flex items-center gap-3 w-full focus-within:ring-2 focus-within:ring-gold/40">
    <span id={`${id}-prefix`} className="shrink-0 border-r border-border pr-3 text-foreground">+998</span>
    <input id={id} type="tel" inputMode="tel" autoComplete="tel-national" value={formatUzPhone(digits)}
      aria-describedby={`${id}-prefix`} placeholder="99 102 02 00" className="min-w-0 w-full bg-transparent outline-none" dir="ltr"
      onKeyDown={event => {
        const input = event.currentTarget, cursor = input.selectionStart;
        if (cursor === null || input.selectionEnd !== cursor) return;
        if (event.key === "Backspace" && input.value[cursor - 1] === " ") input.setSelectionRange(cursor - 2, cursor);
        if (event.key === "Delete" && input.value[cursor] === " ") input.setSelectionRange(cursor, cursor + 2);
      }}
      onChange={event => {
        const input = event.currentTarget, raw = input.value, local = uzPhoneDigits(raw);
        if (local === null) return;
        const before = raw.slice(0, input.selectionStart ?? raw.length).replace(/\D/g, "").length;
        const prefix = raw.replace(/\D/g, "").length - local.length;
        const wanted = Math.max(0, before - prefix);
        onChange(local ? `998${local}` : "");
        requestAnimationFrame(() => {
          let count = 0, position = 0;
          while (position < input.value.length && count < wanted) { if (/\d/.test(input.value[position])) count++; position++; }
          input.setSelectionRange(position, position);
        });
      }} />
  </div>;
}
