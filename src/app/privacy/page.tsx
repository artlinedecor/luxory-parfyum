import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import PrivacyPolicyPage from "../privacy-policy/page";

// /privacy — /privacy-policy ning nusxasi; dublikat bo'lmasligi uchun
// canonical asosiy manzilga ishora qiladi.
export const metadata: Metadata = {
  title: `Maxfiylik siyosati — ${siteConfig.siteName}`,
  alternates: { canonical: `${siteConfig.siteUrl}/privacy-policy` },
};

export default PrivacyPolicyPage;
