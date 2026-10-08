import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

// Savat shaxsiy sahifa — qidiruvga chiqmaydi.
export const metadata: Metadata = {
  title: `Savat — ${siteConfig.siteName}`,
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
