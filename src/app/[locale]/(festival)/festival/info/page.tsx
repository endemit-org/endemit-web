import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { festivalCopy, type FestivalLocale } from "@/app/_components/festival/copy";
import styles from "@/app/_components/festival/festival.module.css";
import { Link } from "@/i18n/navigation";

type PageProps = { params: Promise<{ locale: string }> };

const toLocale = (locale: string): FestivalLocale => (locale === "en" ? "en" : "sl");

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = festivalCopy[toLocale((await params).locale)];
  return { title: `Endemit festival · ${t.infoTitle}`, robots: { index: false, follow: false } };
}

export default async function FestivalInfoPage({ params }: PageProps) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = festivalCopy[locale];
  const blocks = [...t.stay, ...t.food, t.codex, t.wallet, t.location];

  return (
    <main className={`${styles.root} ${styles.page}`} lang={locale}>
      <div className={styles.inner}>
        <div className={styles.pageHead}>
          <Link href="/festival" className={styles.footLogo} aria-label="Endemit festival">
            <EndemitLogo />
          </Link>
          <Link href="/festival" className={styles.tag}>
            ← {t.back}
          </Link>
        </div>
        <h1 className={`${styles.display} ${styles.pageTitle}`}>{t.infoTitle}</h1>
        <div className={styles.infoGrid}>
          {blocks.map(block => (
            <section key={block.title} className={styles.infoItem}>
              <h3>{block.title}</h3>
              {block.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              {block.note ? <p className={styles.infoNote}>{block.note}</p> : null}
              {block === t.wallet ? (
                <p>
                  <Link href="/wallet">{t.walletLink} →</Link>
                </p>
              ) : null}
            </section>
          ))}
        </div>
        <p style={{ marginTop: "2.4rem" }}>
          <Link href="/festival#tickets" className={`${styles.tag} ${styles.tagSolid}`}>
            {t.cta} →
          </Link>
        </p>
      </div>
    </main>
  );
}
