import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

// Admin kirish sahifasi — qidiruvga chiqmaydi.
export const metadata: Metadata = {
  title: `Kirish — ${siteConfig.siteName}`,
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
