import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

// Sahifa o'zi "use client" — metadata shu yerda beriladi. Avval bu sahifa
// layout'dagi bosh sahifa title/canonical'ini meros olardi.
const TITLE = `Maxfiylik siyosati — ${siteConfig.siteName}`;
const DESCRIPTION = `${siteConfig.siteName} maxfiylik siyosati: buyurtma berishda qanday shaxsiy ma'lumotlar to'planadi, qanday saqlanadi va himoya qilinadi.`;
const URL = `${siteConfig.siteUrl}/privacy-policy`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: siteConfig.siteName,
    images: [siteConfig.ogImage],
    locale: "uz_UZ",
    type: "website",
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
