"use client";

import type { ButtonHTMLAttributes } from "react";
import { UzumMark } from "@/components/PaymentLogos";
import styles from "./PaymentOptionButton.module.css";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  provider: "alif" | "uzum" | "card";
  title: string;
  description: string;
  badge?: string;
  loading?: boolean;
  highlighted?: boolean;
}

export default function PaymentOptionButton({ provider, title, description, badge, loading, highlighted, className, ...props }: Props) {
  return (
    <button {...props} type="button" aria-busy={loading || undefined}
      className={[styles.option, highlighted ? styles.highlighted : "", className].filter(Boolean).join(" ")}>
      <span className={styles.brand} aria-hidden="true">
        {loading ? <span className={styles.spinner} /> : provider === "alif"
          ? <span className={styles.alif}>alif</span>
          : provider === "uzum" ? <UzumMark size={38} />
          : <svg width="36" height="36" viewBox="0 0 32 32" fill="none" className={styles.card}>
              <rect x="3" y="6" width="26" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M4 12h24M19 21h3m2 0h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>}
      </span>
      <span className={styles.copy}>
        <span className={styles.heading}>
          <span className={styles.title}>{title}</span>
          {badge && <span className={styles.badge}>{badge}</span>}
        </span>
        <span className={styles.description}>{description}</span>
      </span>
    </button>
  );
}
