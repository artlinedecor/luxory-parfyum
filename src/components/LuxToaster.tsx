"use client";

import { Toaster } from "sonner";

/**
 * Bildirishnomalar — do'kon uslubida: to'g'ri burchak, nozik chegara,
 * porloq rang yo'q. Telefonda pastdan (BottomNav ustidan), kompyuterda
 * o'ng pastdan chiqadi.
 */
export default function LuxToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={96}
      mobileOffset={96}
      duration={2600}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-full flex items-center gap-3 px-4 py-3.5 bg-[#1a1a1a] text-[#faf8f5] " +
            "text-[11px] uppercase tracking-[0.16em] font-medium " +
            "shadow-[0_20px_50px_-30px_rgba(26,26,26,0.8)]",
          title: "leading-tight",
          description:
            "mt-1 text-[11px] normal-case tracking-normal text-[#faf8f5]/60",
          actionButton:
            "ml-auto shrink-0 px-3 py-1.5 border border-[#faf8f5]/30 " +
            "text-[10px] uppercase tracking-[0.16em] hover:border-[#faf8f5] transition-colors",
        },
      }}
    />
  );
}
