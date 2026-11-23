/* eslint-disable @next/next/no-img-element -- hand-tuned srcset on local, pre-optimized art */
import type { CSSProperties, ReactNode } from "react";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import FestivalNewsletter from "./FestivalNewsletter";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/util/formatting";
import { festivalCopy, type FestivalLocale } from "./copy";
import type { FestivalData, TimelineStep } from "./data";
import { FilmPlayer, LoopVideo, MapViewer, SceneMotion, SectionNav, SoundToggle } from "./motion";
import Gallery from "./Gallery";
import { findPhoto, GALLERY, PLACE } from "./photos";
import TicketBuilder from "./TicketBuilder";
import Trip from "./Trip";
import styles from "./festival.module.css";

const ART = "/images/festival/2027";
const ROOT_ID = "festival-2027";

const css = (vars: Record<string, string | number>) => vars as CSSProperties;

/** Illustration layer with a small and a large source. */
function Layer({
  name,
  widths,
  ratio,
  sizes,
  className,
  eager,
  style,
}: {
  name: string;
  widths: [number, number];
  ratio: number;
  sizes: string;
  className?: string;
  eager?: boolean;
  style?: CSSProperties;
}) {
  const [large, small] = widths;
  return (
    <img
      className={className}
      style={style}
      src={`${ART}/${name}-${small}.webp`}
      srcSet={`${ART}/${name}-${small}.webp ${small}w, ${ART}/${name}-${large}.webp ${large}w`}
      sizes={sizes}
      width={large}
      height={Math.round(large * ratio)}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

/** Heading with the word repeated behind itself. */
function Echo({ children, as: Tag = "h2" }: { children: string; as?: "h1" | "h2" }) {
  return (
    <Tag className={`${styles.display} ${styles.boil}`}>
      <span className={styles.echo}>
        {[1, 2, 3].map(i => (
          <span key={i} aria-hidden style={css({ "--i": i })}>
            {children}
          </span>
        ))}
        <span>{children}</span>
      </span>
    </Tag>
  );
}

function Creature({ n, style }: { n: number; style: Record<string, string | number> }) {
  return (
    <img
      className={styles.creature}
      style={css(style)}
      src={`${ART}/creature-${n}.webp`}
      width={200}
      height={266}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}

/** A row of creatures peeking over the top edge of a section. */
function CreatureRow({ spots }: { spots: [n: number, x: string, w: number][] }) {
  return (
    <div className={styles.creatureRow} aria-hidden>
      <div className={styles.creatureMask}>
        {spots.map(([n, x, w], i) => (
          <Creature key={i} n={n} style={{ "--x": x, "--w": `${w}px`, "--i": i }} />
        ))}
      </div>
    </div>
  );
}

type Shot = { photo: string; span: number; wide: number; tilt: number; drop?: string } | { loop: string; span: number; wide: number; tilt: number; drop?: string };

const DAY: Shot[] = [
  { photo: "smoke-dance-2", span: 6, wide: 7, tilt: -0.8 },
  { photo: "sunbeam-tree", span: 3, wide: 3, tilt: 1.6, drop: "1.4rem" },
  { loop: "meadow", span: 3, wide: 2, tilt: -1.4 },
  { photo: "river", span: 4, wide: 4, tilt: 1.1 },
  { photo: "sign-tree", span: 2, wide: 2, tilt: -2.1, drop: "-1rem" },
  { loop: "camp", span: 2, wide: 2, tilt: 1.8 },
  { photo: "watermelon", span: 4, wide: 4, tilt: -1.2 },
  { loop: "smoke", span: 2, wide: 3, tilt: -1.7 },
  { photo: "grass-crew", span: 6, wide: 7, tilt: 0.7 },
  { photo: "dancers", span: 3, wide: 2, tilt: -1.5 },
  { photo: "blue-smoke", span: 3, wide: 3, tilt: 1.3, drop: "1rem" },
  { photo: "curtain-path", span: 2, wide: 3, tilt: -1.1 },
  { photo: "dome-dj", span: 4, wide: 6, tilt: 0.9 },
];

const NIGHT: Shot[] = [
  { photo: "blue-floor", span: 6, wide: 7, tilt: 0.9 },
  { photo: "disco", span: 3, wide: 3, tilt: -1.6 },
  { loop: "lasers", span: 3, wide: 2, tilt: 1.7, drop: "1.2rem" },
  { photo: "teal-crowd", span: 6, wide: 5, tilt: -0.7 },
  { photo: "blue-beam", span: 3, wide: 3, tilt: 1.4 },
  { photo: "violet-beam", span: 3, wide: 2, tilt: -1.9, drop: "-0.8rem" },
  { loop: "hands", span: 3, wide: 2, tilt: 1.2 },
  { photo: "purple-laser", span: 3, wide: 3, tilt: -1.2, drop: "1rem" },
  { photo: "night-bar", span: 6, wide: 6, tilt: 0.8 },
  { photo: "green-laser", span: 2, wide: 3, tilt: 1.8 },
  { photo: "silhouettes", span: 2, wide: 3, tilt: -1.4 },
  { photo: "laser-dome-3", span: 2, wide: 3, tilt: 1.1 },
  { photo: "pink-sky", span: 6, wide: 6, tilt: -0.6 },
  { photo: "lantern-line", span: 6, wide: 7, tilt: 0.7 },
  { photo: "green-dome", span: 6, wide: 5, tilt: -1 },
];

function ShotFigure({ shot, tone }: { shot: Shot; tone: "day" | "night" }) {
  const item = "photo" in shot ? findPhoto(shot.photo) : null;
  const vars = css({
    "--span": shot.span,
    "--span-wide": shot.wide,
    "--tilt": `${shot.tilt}deg`,
    "--drop": shot.drop ?? "0",
    "--ratio": item ? `${item.w} / ${item.h}` : "9 / 16",
  });
  return (
    <figure className={`${styles.shot} ${styles.jitter}`} data-tone={tone} style={vars}>
      {item ? (
        <button type="button" data-gallery={item.slug}>
          <img
            src={`${ART}/photo-${item.slug}-640.webp`}
            srcSet={`${ART}/photo-${item.slug}-640.webp 640w, ${ART}/photo-${item.slug}.webp ${item.w}w`}
            sizes={`(max-width: 900px) ${Math.round((shot.span / 6) * 100)}vw, ${Math.round((shot.wide / 12) * 1100)}px`}
            width={item.w}
            height={item.h}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </button>
      ) : (
        <LoopVideo src={`${ART}/motion/loop-${(shot as { loop: string }).loop}.mp4`} poster={`${ART}/motion/loop-${(shot as { loop: string }).loop}.webp`} label="" />
      )}
    </figure>
  );
}

/** Two ring fields drifting across each other. */
function Pattern() {
  return (
    <div className={styles.pattern} aria-hidden>
      <span />
      <span />
    </div>
  );
}

// Word lengths of fourteen names nobody knows yet.
const MYSTERY = [[7, 5], [9], [4, 8], [6, 6], [11], [5, 3, 6], [8], [6, 9], [10], [4, 4], [7, 7], [12], [5, 8], [9, 4]];

function MysteryLineup({ title, soon, note }: { title: string; soon: string; note: string }) {
  return (
    <div className={styles.lineup}>
      <div className={styles.lineupHead}>
        <h3 className={styles.boilSmall}>{title}</h3>
        <span className={`${styles.tag} ${styles.jitter}`}>{soon}</span>
      </div>
      <ol className={styles.boilSmall} aria-label={`${title}: ${soon}`}>
        {MYSTERY.map((words, i) => (
          <li key={i} style={css({ "--i": i })}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <span aria-hidden>
              {words.map((length, j) => (
                <i key={j} style={css({ "--w": length })} />
              ))}
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.dim}>{note}</p>
    </div>
  );
}

function stepState(step: TimelineStep, now: number) {
  if (now > Date.parse(step.until)) return "done";
  return now >= Date.parse(step.from) ? "now" : "next";
}

function Scene({ className, children, id }: { className: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={`${styles.section} ${className}`} data-scene>
      {children}
    </section>
  );
}

const METEORS = [
  ["12%", "58%", 0, 6.5],
  ["30%", "88%", 1.9, 7.5],
  ["52%", "70%", 3.4, 6],
  ["8%", "34%", 4.6, 8],
  ["66%", "96%", 5.8, 7],
] as const;

export default function Festival({ locale, data }: { locale: FestivalLocale; data: FestivalData }) {
  const t = festivalCopy[locale];
  const now = Date.now();
  const dateFormat = new Intl.DateTimeFormat(locale === "sl" ? "sl-SI" : "en-GB", { day: "numeric", month: "short" });
  const marquee = (
    <span>
      {t.marquee.map((phrase, i) => (
        <span key={i} style={{ display: "contents" }}>
          {phrase}
          <img src={`${ART}/creature-${(i % 6) + 1}.webp`} width={200} height={266} alt="" loading="lazy" />
        </span>
      ))}
    </span>
  );

  return (
    <main id={ROOT_ID} className={styles.root} lang={locale}>
      <SceneMotion rootId={ROOT_ID} />
      <SectionNav label={t.navLabel} items={t.nav} />
      <svg className={styles.defs} aria-hidden focusable="false">
        <defs>
          {[
            ["fest-boil-a", 3, 5.5, 0.03],
            ["fest-boil-b", 11, 5.5, 0.03],
            ["fest-boil-c", 23, 5.5, 0.03],
            ["fest-boil-sa", 5, 2.2, 0.05],
            ["fest-boil-sb", 17, 2.2, 0.05],
            ["fest-boil-sc", 29, 2.2, 0.05],
          ].map(([id, seed, scale, frequency]) => (
            <filter key={id} id={String(id)} x="-4%" y="-12%" width="108%" height="124%">
              <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={seed} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
          <filter id="fest-warp" x="-12%" y="-12%" width="124%" height="124%">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.013" numOctaves={2} seed={7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={0} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      {/* ---- sky ---- */}
      <header className={styles.hero} data-scene>
        <div className={styles.heroPin}>
          <picture>
            <source
              type="image/avif"
              srcSet={`${ART}/sky-800.avif 800w, ${ART}/sky-1400.avif 1400w`}
              sizes="(max-width: 700px) 150vw, 100vw"
            />
            <img className={styles.sky} src={`${ART}/sky-fallback.webp`} width={1400} height={1253} alt="" fetchPriority="high" decoding="async" />
          </picture>
          <Layer name="stars" widths={[1600, 900]} ratio={0.7808} sizes="100vw" className={styles.stars} eager />
          <Layer name="stars" widths={[1600, 900]} ratio={0.7808} sizes="100vw" className={`${styles.stars} ${styles.starsB}`} eager />
          <div className={styles.meteors} aria-hidden>
            {METEORS.map(([y, x, delay, dur], i) => (
              <span key={i} className={styles.meteor} style={css({ "--y": y, "--x": x, "--delay": `${delay}s`, "--dur": `${dur}s` })} />
            ))}
          </div>

          <div className={styles.mark}>
            <h1 style={{ margin: 0 }}>
              <span className={`${styles.logo} ${styles.boil}`} role="img" aria-label="Endemit">
                <EndemitLogo />
              </span>
              <span className={`${styles.festivalWord} ${styles.boilSmall}`}>FESTIVAL</span>
            </h1>
            <p className={styles.dateline}>
              <b>{t.dateline}</b> {t.year} · {t.place}
            </p>
            <div className={styles.heroActions}>
              <a className={`${styles.tag} ${styles.tagSolid} ${styles.jitter}`} href="#tickets">
                {t.cta}
              </a>
            </div>
          </div>

          <span className={styles.scrollHint} aria-hidden>
            {t.scroll} ↓
          </span>
          <Layer name="hill-far" widths={[1600, 900]} ratio={0.4331} sizes="max(100vw, 900px)" className={styles.heroHill} eager />
        </div>
      </header>

      {/* ---- about, on the far hill ---- */}
      <Scene className={styles.about} id="about">
        <div className={`${styles.inner} ${styles.aboutGrid}`}>
          <div>
            <Echo>{t.aboutTitle}</Echo>
          </div>
          <div>
            {t.about.map((paragraph, i) => (
              <p key={i} className={styles.lede}>
                {paragraph}
              </p>
            ))}
            <p className={`${styles.motto} ${styles.boilSmall}`}>
              {t.motto.map(line => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </div>
        </div>
      </Scene>

      <div className={styles.marquee} aria-hidden>
        <div className={styles.marqueeTrack}>
          {marquee}
          {marquee}
        </div>
      </div>

      {/* ---- film, on the middle hill ---- */}
      <Scene className={styles.film} id="impressions">
        <div className={`${styles.inner} ${styles.filmGrid}`}>
          <div>
            <Echo>{t.filmTitle}</Echo>
          </div>
          <FilmPlayer
            src={`${ART}/motion/film.mp4`}
            poster={`${ART}/motion/film.webp`}
            loop={{ src: `${ART}/motion/loop-green.mp4`, poster: `${ART}/motion/film.webp` }}
            playLabel={t.filmCta}
            closeLabel={t.filmClose}
          />
        </div>
      </Scene>

      {/* ---- collage, on the near hill ---- */}
      <Scene className={styles.vibe}>
        <Layer name="hill-near" widths={[1600, 900]} ratio={0.5843} sizes="max(100vw, 900px)" className={styles.edge} style={css({ "--depth": 22 })} />
        <div className={styles.inner}>
          {data.showLineup ? null : <MysteryLineup title={t.lineupTitle} soon={t.lineupSoon} note={t.lineup} />}
          <Echo>{t.vibeTitle}</Echo>
          <div className={styles.collage}>
            {DAY.map((shot, i) => (
              <ShotFigure key={i} shot={shot} tone="day" />
            ))}
            <Trip word={t.nightWord} />
            {NIGHT.map((shot, i) => (
              <ShotFigure key={i} shot={shot} tone="night" />
            ))}
          </div>
          <p className={styles.collageMore}>
            <button type="button" className={`${styles.tag} ${styles.jitter}`} data-gallery="">
              {t.galleryAll} →
            </button>
          </p>
        </div>
      </Scene>

      {/* ---- forest: releases and tickets ---- */}
      <Scene className={styles.forest} id="tickets">
        {/* The dome stands in the clearing painted into the forest layer: in
            front of the back treetops, behind the bushes with the glowing rim.
            The forest is drawn twice, the second copy clipped to those bushes. */}
        <div className={styles.forestEdge} aria-hidden>
          <Layer name="forest" widths={[1600, 900]} ratio={0.5458} sizes="max(100vw, 900px)" className={styles.forestImage} />
          <div className={styles.dome}>
            {[0, 1, 2, 3].map(i => (
              <span key={i} className={styles.ring} style={css({ "--i": i })} />
            ))}
            <Layer name="dome" widths={[720, 420]} ratio={0.3293} sizes="(max-width: 900px) 190px, 21vw" />
          </div>
          <Layer name="forest" widths={[1600, 900]} ratio={0.5458} sizes="max(100vw, 900px)" className={styles.forestFront} />
        </div>
        <CreatureRow spots={[[3, "8%", 46], [1, "31%", 58], [6, "57%", 42], [4, "82%", 54]]} />
        <div className={styles.inner}>
          <Echo>{t.ticketsTitle}</Echo>
          <p className={styles.lede} style={{ marginTop: "1.4rem" }}>
            {t.ticketsIntro}
          </p>

          <ol className={styles.timeline}>
            {data.timeline.map(step => {
              const state = stepState(step, now);
              return (
                <li key={step.title} className={styles.step} data-state={state}>
                  <span className={styles.stepDot} aria-hidden />
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepPrice}>{step.price === null ? "" : formatPrice(step.price)}</span>
                  <span className={styles.stepMeta}>
                    {state === "now" ? <span className={styles.stepFlag}>{t.timelineNow} · </span> : null}
                    {state === "done" ? <span>{t.timelineDone} · </span> : null}
                    {dateFormat.format(new Date(step.from))} – {dateFormat.format(new Date(step.until))}
                    {step.description ? ` · ${step.description}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>

          <TicketBuilder locale={locale} offers={data.offers} salesOpen={data.salesOpen} />
        </div>
      </Scene>

      {/* ---- map ---- */}
      <Scene className={styles.map} id="map">
        <div className={styles.inner}>
          <Echo>{t.mapTitle}</Echo>
          <p className={styles.lede} style={{ marginTop: "1.4rem" }}>
            {t.mapIntro}
          </p>
          <MapViewer
            src={`/images/festival/map-${locale}.webp`}
            alt={t.mapTitle}
            width={1500}
            height={2143}
            openLabel={t.mapOpen}
            closeLabel={t.mapClose}
          />
        </div>
      </Scene>

      {/* ---- practical, down among the trees ---- */}
      <Scene className={styles.info} id="info">
        <Pattern />
        <div className={styles.inner}>
          <Echo>{t.infoTitle}</Echo>
          <div className={styles.infoGrid}>
            {[t.stay[0], t.food[0], t.wallet, t.location].map(block => (
              <div key={block.title} className={styles.infoItem}>
                <h3>{block.title}</h3>
                <p>{block.paragraphs[0]}</p>
                {block.note ? <p className={styles.infoNote}>{block.note}</p> : null}
              </div>
            ))}
          </div>
          <div className={styles.reel}>
            {PLACE.map((item, i) => (
              <button key={item.slug} type="button" className={styles.jitter} data-gallery={item.slug} style={css({ "--tilt": `${[-1.4, 1.1, -0.7, 1.6, -1.2][i % 5]}deg`, "--ratio": `${item.w} / ${item.h}` })}>
                <img src={`${ART}/photo-${item.slug}-640.webp`} width={item.w} height={item.h} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
          <p style={{ marginTop: "2rem" }}>
            <Link className={`${styles.tag} ${styles.jitter}`} href="/festival/info">
              {t.infoMore} →
            </Link>
          </p>
        </div>
        <div className={styles.grove} aria-hidden>
          <div className={styles.tree} style={css({ "--w": "min(44vw, 380px)", "--x": "-6%", "--depth": 38 })}>
            <Layer name="tree-b" widths={[720, 420]} ratio={1.4739} sizes="(max-width: 860px) 44vw, 380px" />
            <Creature n={2} style={{ "--w": "17%", "--x": "56%", "--b": "44%", "--i": 2 }} />
          </div>
          <div className={styles.tree} style={css({ "--w": "min(40vw, 330px)", "--x": "20%", "--depth": 22 })}>
            <Layer name="tree-a" widths={[760, 440]} ratio={0.9481} sizes="(max-width: 860px) 40vw, 330px" />
          </div>
          <div className={styles.tree} style={css({ "--w": "min(34vw, 270px)", "--r": "-3%", "--depth": 30 })}>
            <Layer name="tree-c" widths={[520, 320]} ratio={1.3022} sizes="(max-width: 860px) 34vw, 270px" />
            <Creature n={5} style={{ "--w": "22%", "--x": "8%", "--b": "52%", "--i": 4 }} />
          </div>
        </div>
      </Scene>

      {/* ---- newsletter ---- */}
      <Scene className={styles.outro} id="newsletter">
        <CreatureRow spots={[[5, "14%", 50], [2, "46%", 44], [3, "74%", 40]]} />
        <div className={styles.inner}>
          <Echo>{t.newsletterTitle}</Echo>
          <div className={styles.newsletter}>
            <FestivalNewsletter locale={locale} description={t.newsletterText} />
          </div>
        </div>
      </Scene>

      <footer className={styles.foot} data-scene>
        <Link href="/" className={`${styles.footLogo} ${styles.boilSmall}`} aria-label="Endemit">
          <EndemitLogo />
        </Link>
        <span>
          {t.dateline} {t.year} · {t.place}
        </span>
        <Link href="/festival/info">{t.infoMore}</Link>
      </footer>

      <Gallery photos={GALLERY} labels={{ title: t.galleryAll, close: t.galleryClose, previous: t.galleryPrevious, next: t.galleryNext }} />
      <SoundToggle onLabel={t.soundOn} offLabel={t.soundOff} />
    </main>
  );
}
