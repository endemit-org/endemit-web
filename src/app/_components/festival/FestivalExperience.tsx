"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ForestSoundscape } from "./soundscape";
import { editorialCopy } from "./editorialCopy";
import reference from "./reference.json";
import TicketBuilder from "./TicketBuilder";
import baseStyles from "./editorial.module.css";
import j from "./journey.module.css";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import JourneyMedia from "./JourneyMedia";
import { Canopy, RiverThread, Passage } from "./JourneyLayers";
import { useJourneyMotion } from "./useJourneyMotion";

const s = Object.fromEntries(
  Object.entries(baseStyles).map(([name, value]) => [
    name,
    [value, j[name]].filter(Boolean).join(" "),
  ])
);

const sections = ["story", "artists", "stay", "food", "location", "tickets"];
type Artist = (typeof reference.artists)[number];
type Modal =
  | { type: "artist"; artist: Artist }
  | { type: "gallery"; index: number }
  | { type: "map" }
  | { type: "film" }
  | null;

export default function FestivalExperience({
  locale,
}: {
  locale: "en" | "sl";
}) {
  const c = editorialCopy[locale],
    sl = locale === "sl";
  const root = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    iframe = useRef<HTMLIFrameElement>(null);
  const audio = useRef<ForestSoundscape | null>(null),
    desired = useRef(false),
    blocked = useRef(false);
  const [sound, setSound] = useState(false),
    [volume, setVolume] = useState(0.4),
    [modal, setModal] = useState<Modal>(null),
    [hash, setHash] = useState(""),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(false);
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useJourneyMotion(root, motion);
  const movingFilm = (
    clip: "forest" | "dance" | "lights" | "signal",
    caption: string,
    wide = false
  ) => (
    <JourneyMedia
      clip={clip}
      caption={caption}
      locale={locale}
      motion={motion}
      blocked={!!modal}
      wide={wide}
    />
  );
  const applyAudio = useCallback(() => {
    if (audio.current)
      void audio.current
        .setEnabled(desired.current && !blocked.current && !document.hidden)
        .catch(() => setError(true));
  }, []);
  const toggleSound = () => {
    try {
      if (!audio.current) {
        audio.current = new ForestSoundscape();
        const artist = document.getElementById("artists")?.offsetTop || 1800;
        audio.current.setProgress(Math.min(1, scrollY / artist));
      }
      desired.current = !desired.current;
      audio.current.setVolume(volume);
      applyAudio();
      setSound(desired.current);
      setError(false);
    } catch {
      setError(true);
    }
  };
  useEffect(() => {
    let frame = 0;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const scroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const artist = document.getElementById("artists")?.offsetTop || 1800;
        const p = Math.min(1, scrollY / artist);
        audio.current?.setProgress(p);
        if (!media.matches)
          root.current?.style.setProperty(
            "--drift",
            String(Math.min(scrollY, 1200) * 0.04)
          );
      });
    };
    const syncHash = () => setHash(location.hash);
    syncHash();
    scroll();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("hashchange", syncHash);
    document.addEventListener("visibilitychange", applyAudio);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", scroll);
      removeEventListener("hashchange", syncHash);
      document.removeEventListener("visibilitychange", applyAudio);
      audio.current?.dispose();
      audio.current = null;
    };
  }, [applyAudio]);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
    } else dialog.current?.close();
    blocked.current = modal?.type === "film";
    applyAudio();
  }, [modal, applyAudio]);
  useEffect(() => {
    if (modal?.type !== "film") return;
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== "https://player.vimeo.com" ||
        event.source !== iframe.current?.contentWindow
      )
        return;
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.event === "ready") {
          for (const value of ["play", "pause", "ended"])
            iframe.current?.contentWindow?.postMessage(
              { method: "addEventListener", value },
              "https://player.vimeo.com"
            );
        }
        if (data.event === "play") {
          blocked.current = true;
          applyAudio();
        }
        if (data.event === "pause" || data.event === "ended") {
          blocked.current = false;
          applyAudio();
        }
      } catch {}
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, [modal, applyAudio]);
  const go = (id: string) => {
    setMenu(false);
    setHash("#" + id);
  };
  const image = (
    src: string,
    alt: string,
    className?: string,
    priority = false
  ) => (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={900}
      className={className}
      sizes="(max-width: 650px) 100vw, 50vw"
      priority={priority}
    />
  );
  const title = (lines: string[]) => (
    <h2>
      {lines[0]}
      <br />
      <em>{lines[1]}</em>
    </h2>
  );
  return (
    <div
      ref={root}
      className={`${s.experience} ${j.journey}`}
      data-motion={motion ? "on" : "off"}
    >
      <a className={s.skip} href="#tickets">
        {sl ? "Preskoči na karte" : "Skip to tickets"}
      </a>
      <header className={s.header}>
        <a
          className={s.wordmark}
          href="#threshold"
          onClick={() => go("threshold")}
        >
          <span className={s.srOnly}>Endemit</span>
          <EndemitLogo />
        </a>
        <button
          className={s.menuButton}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {sl ? "Meni" : "Menu"} {menu ? "−" : "+"}
        </button>
        <nav
          className={menu ? s.openMenu : ""}
          aria-label={sl ? "Festivalska navigacija" : "Festival navigation"}
        >
          {sections.map((id, i) => (
            <a key={id} href={"#" + id} onClick={() => go(id)}>
              {c.nav[i]}
            </a>
          ))}
        </nav>
        <div className={s.languages}>
          {(["sl", "en"] as const).map(l => (
            <a
              key={l}
              href={`${l === "en" ? "/en" : ""}/festival${hash}`}
              hrefLang={l}
              lang={l}
              aria-current={locale === l ? "true" : undefined}
              onClick={() => {
                document.cookie = `ENDEMIT_LOCALE=${l};path=/;max-age=31536000;SameSite=Lax`;
              }}
            >
              {l}
            </a>
          ))}
        </div>
      </header>
      <main className={j.trail}>
        <RiverThread />
        <div className={j.arrivalRunway} data-reveal="arrival">
          <section id="threshold" className={s.hero}>
            <div className={s.heroArt} aria-hidden="true" />
            <div className={j.arrivalFilm}>
              {movingFilm(
                "forest",
                sl
                  ? "Med drevesi · arhiv 2025"
                  : "Between the trees · 2025 archive",
                true
              )}
            </div>
            <div className={j.arrivalCanopy}>
              <Canopy side="left" />
              <Canopy side="right" />
            </div>
            <div className={s.orbit} aria-hidden="true" />
            <span className={s.meteor} aria-hidden="true" />
            <div className={s.heroContent}>
              <p className={s.kicker}>
                {c.date} <span>✦</span> {c.place}
              </p>
              <div className={j.heroLogo} aria-label="Endemit festival">
                <EndemitLogo />
              </div>
              <h1>
                {c.title[0]} <br />
                <em>{c.title[1]}</em>
              </h1>
              <p className={s.intro}>{c.intro}</p>
              <div className={s.heroActions}>
                <button
                  className={s.primaryButton}
                  onClick={() => {
                    if (!desired.current) toggleSound();
                    location.hash = "story";
                  }}
                >
                  {c.enter} <span>◖))</span>
                </button>
                <a href="#story" onClick={() => go("story")}>
                  {c.quiet} ↘
                </a>
              </div>
            </div>
            <div className={s.heroBottom}>
              <span>46°36′35.6″N / 14°58′24.1″E</span>
              <span>✦ &nbsp; PERSEIDS / 2027</span>
            </div>
          </section>
        </div>
        <div className={s.previewBanner}>{c.preview}</div>
        <section id="story" className={`${s.section} ${s.story}`} data-reveal>
          <div className={s.storyText}>
            <p className={s.kicker}>{c.storyKicker}</p>
            {title(c.storyTitle)}
            <p className={s.lead}>{c.storyBody}</p>
            <span className={s.handStar} aria-hidden="true">
              ✳
            </span>
          </div>
          <div className={s.storyCollage}>
            <div className={j.storyPortrait}>
              {movingFilm(
                "signal",
                sl
                  ? "Nekje v šumi · arhiv"
                  : "Somewhere in the forest · archive"
              )}
            </div>
            <figure>
              {image(
                reference.gallery[4].src,
                sl
                  ? "Jutranja svetloba v festivalski šumi"
                  : "Morning light in the festival forest"
              )}
              <figcaption>01 / {sl ? "POČASI." : "SLOW DOWN."}</figcaption>
            </figure>
            <figure>
              {image(
                reference.gallery[0].src,
                sl
                  ? "Noč na endemitskem plesišču"
                  : "A night on the Endemit dancefloor"
              )}
              <figcaption>02 / {sl ? "PA SPET." : "THEN AGAIN."}</figcaption>
            </figure>
            <div className={s.endmitek} aria-hidden="true">
              {image("/images/festival/endmitek.webp", "")}
            </div>
          </div>
        </section>
        <Passage
          label={
            sl
              ? "Skozi veje. Za zvokom."
              : "Through the branches. Towards the sound."
          }
        >
          <div className={j.passageTitle}>
            {sl ? "BLIŽJE." : "CLOSER."}
            <span>{sl ? "Čutiš?" : "Can you feel it?"}</span>
          </div>
          <div className={j.passagePortrait}>
            {movingFilm(
              "dance",
              sl ? "Na plesišču · arhiv" : "On the dancefloor · archive"
            )}
          </div>
        </Passage>
        <section className={`${s.section} ${s.filmSection}`}>
          <div>
            <p className={s.kicker}>{c.archive}</p>
            <h2>{c.film}</h2>
          </div>
          <button
            className={s.filmPoster}
            onClick={() => setModal({ type: "film" })}
          >
            {image(reference.gallery[2].src, c.play)}
            <span className={s.playCircle}>▶</span>
            <span className={s.filmLabel}>
              {c.play} <span>↗</span>
            </span>
          </button>
        </section>
        <section
          id="artists"
          className={`${s.section} ${s.artists}`}
          data-reveal
        >
          <p className={s.kicker}>{c.artistsKicker}</p>
          {title(c.artistsTitle)}
          <p className={s.previewNote}>{c.artistNote}</p>
          <div className={j.artistSideFilm}>
            {movingFilm(
              "lights",
              sl ? "Še en komad · arhiv" : "One more track · archive"
            )}
          </div>
          <div className={s.artistGrid}>
            {reference.artists.map((a, i) => (
              <button
                key={a.uid}
                className={s.artistCard}
                onClick={() => setModal({ type: "artist", artist: a })}
              >
                {image(a.image, a.name)}
                <span className={s.artistMeta}>
                  {String(i + 1).padStart(2, "0")} / {a.stage[locale]}
                </span>
                <span className={s.artistName}>
                  {a.name}
                  <span>↗</span>
                </span>
                <span className={s.srOnly}>{c.artistMore}</span>
              </button>
            ))}
          </div>
        </section>
        <section className={`${s.section} ${s.gallerySection}`}>
          <div className={s.sectionHeading}>
            <h2>{c.galleryTitle}</h2>
            <p>{c.galleryBody}</p>
          </div>
          <div className={s.gallery}>
            {reference.gallery.map((g, i) => (
              <button
                key={g.src}
                onClick={() => setModal({ type: "gallery", index: i })}
              >
                {image(g.src, `${c.archive} · ${i + 1}`)}
                <span>
                  {String(i + 1).padStart(2, "0")} <span>↗</span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <Passage
          label={
            sl
              ? "Noč se počasi prelije v jutro."
              : "Night slowly spills into morning."
          }
        >
          <div className={j.daybreak}>
            {movingFilm(
              "forest",
              sl ? "Zjutraj · arhiv 2025" : "The morning after · 2025 archive",
              true
            )}
            <span>{sl ? "POČAS." : "SLOW."}</span>
          </div>
        </Passage>
        <section id="stay" className={`${s.section} ${s.stay}`} data-reveal>
          <p className={s.kicker}>{c.stayKicker}</p>
          {title(c.stayTitle)}
          <p className={s.previewNote}>{c.reference}</p>
          <div className={s.stayGrid}>
            {[
              {
                title: c.camp,
                body: c.campBody,
                img:
                  reference.lodging[locale][0]?.images[0] ||
                  reference.gallery[4].src,
              },
              {
                title: c.tent,
                body: c.tentBody,
                img:
                  reference.lodging[locale][0]?.images[0] ||
                  reference.gallery[4].src,
              },
              {
                title: c.otherStay,
                body: c.otherStayBody,
                img:
                  reference.lodging[locale][1]?.images[0] ||
                  reference.gallery[5].src,
              },
            ].map((item, i) => (
              <article key={item.title}>
                {image(item.img, item.title)}
                <span className={s.cardIndex}>0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {i === 1 ? (
                  <a href="#tickets" className={s.textLink}>
                    {c.bookStay} ↗
                  </a>
                ) : (
                  <a href="#stay-guide" className={s.textLink}>
                    {c.details} ↓
                  </a>
                )}
              </article>
            ))}
          </div>
          <div id="stay-guide" className={s.accordions}>
            {reference.lodging[locale].map((item, i) => (
              <details key={i}>
                <summary>
                  {item.title}
                  <span>+</span>
                </summary>
                {item.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {item.links.map((link, j) => (
                  <a key={j} href={link.url} target="_blank" rel="noreferrer">
                    {link.label} ↗
                  </a>
                ))}
              </details>
            ))}
          </div>
        </section>
        <section id="food" className={`${s.section} ${s.food}`}>
          <div>
            <p className={s.kicker}>{c.foodKicker}</p>
            {title(c.foodTitle)}
            <p className={s.lead}>{c.foodLead}</p>
            <p className={s.previewNote}>{c.reference}</p>
          </div>
          <div className={s.foodGrid}>
            {reference.food[locale].map((item, i) => (
              <article key={i}>
                {item.images[0] && image(item.images[0], item.title)}
                <h3>{item.title}</h3>
                {item.paragraphs.slice(0, 2).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </article>
            ))}
          </div>
        </section>
        <section id="location" className={`${s.section} ${s.location}`}>
          <p className={s.kicker}>{c.mapKicker}</p>
          {title(c.mapTitle)}
          <div className={s.locationLayout}>
            <div>
              <button
                className={s.mapButton}
                onClick={() => setModal({ type: "map" })}
              >
                {image(reference.maps[locale], c.mapLabel)}
                <span>{c.mapOpen} ↗</span>
              </button>
              <p className={s.previewNote}>{c.mapLabel}</p>
            </div>
            <div className={s.travelInfo}>
              <h3>Libeliče</h3>
              <p>{reference.venue.description[locale][0]}</p>
              <address>{reference.venue.address}</address>
              <a
                className={s.primaryButton}
                href={reference.venue.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                {c.directions} ↗
              </a>
              <h4>{c.drive}</h4>
              <p>{c.driveBody}</p>
              <h4>{c.bus}</h4>
              <p>{c.busBody}</p>
              <a className={s.textLink} href="#tickets">
                {sl ? "Dodaj prevoz" : "Add transport"} ↗
              </a>
              <p className={s.riverRule}>{c.riverRule}</p>
            </div>
          </div>
        </section>
        <section className={`${s.section} ${s.wallet}`}>
          <span aria-hidden="true">ǝŧ</span>
          <div>
            <p className={s.kicker}>ENDEPAY / {sl ? "DENARNCA" : "WALLET"}</p>
            <h2>{c.walletTitle}</h2>
            <p>{c.walletBody}</p>
            <a className={s.textLink} href={`${sl ? "" : "/en"}/wallet`}>
              {sl ? "Več o denarnci" : "More about the wallet"} ↗
            </a>
          </div>
        </section>
        <TicketBuilder locale={locale} />
        <section className={`${s.section} ${s.faq}`}>
          <h2>{c.faqTitle}</h2>
          <div className={s.accordions}>
            {c.faq.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <span className={s.handStar} aria-hidden="true">
          ✳
        </span>
        <h2>{c.footer}</h2>
        <p>{c.footerSub}</p>
        <div>
          <a href="#threshold">{c.back} ↑</a>
          <a href={sl ? "/" : "/en"}>{c.main} ↗</a>
        </div>
        <small>ENDEMIT / 2027</small>
      </footer>
      <button
        className={j.motionControl}
        aria-pressed={!motion}
        onClick={() => setMotion(!motion)}
      >
        {motion
          ? sl
            ? "Ⅱ Ustavi gibanje"
            : "Ⅱ Pause motion"
          : sl
            ? "▷ Vključi gibanje"
            : "▷ Resume motion"}
      </button>
      <div className={s.soundControl}>
        <button aria-pressed={sound} onClick={toggleSound}>
          <span aria-hidden="true">{sound ? "◖))" : "◖)"}</span>
          {sound ? c.soundOn : c.soundOff}
        </button>
        {sound && (
          <input
            aria-label={c.volume}
            type="range"
            min="0"
            max=".8"
            step=".02"
            value={volume}
            onChange={e => {
              const v = Number(e.target.value);
              setVolume(v);
              audio.current?.setVolume(v);
            }}
          />
        )}
        {error && (
          <span role="status">
            {sl ? "Pritisni še enkrat" : "Tap to try again"}
          </span>
        )}
      </div>
      <dialog
        ref={dialog}
        className={s.dialog}
        onClose={() => setModal(null)}
        onClick={e => {
          if (e.target === e.currentTarget) setModal(null);
        }}
        onKeyDown={e => {
          if (
            modal?.type === "gallery" &&
            (e.key === "ArrowLeft" || e.key === "ArrowRight")
          )
            setModal({
              type: "gallery",
              index:
                (modal.index +
                  (e.key === "ArrowRight" ? 1 : -1) +
                  reference.gallery.length) %
                reference.gallery.length,
            });
        }}
        aria-label={
          modal?.type === "artist"
            ? modal.artist.name
            : modal?.type === "film"
              ? c.play
              : modal?.type === "map"
                ? c.mapLabel
                : c.archive
        }
      >
        {modal && (
          <div className={s.dialogBody}>
            <button
              className={s.closeButton}
              onClick={() => setModal(null)}
              aria-label={c.close}
            >
              ×
            </button>
            {modal.type === "artist" && (
              <div className={s.artistProfile}>
                {image(modal.artist.image, modal.artist.name)}
                <div>
                  <p className={s.kicker}>
                    {c.artistEdition} / {modal.artist.stage[locale]}
                  </p>
                  <h2>{modal.artist.name}</h2>
                  {modal.artist.description[locale].map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}
            {modal.type === "gallery" && (
              <div className={s.lightbox}>
                {image(
                  reference.gallery[modal.index].src,
                  `${c.archive} · ${modal.index + 1}`
                )}
                <div>
                  <button
                    onClick={() =>
                      setModal({
                        type: "gallery",
                        index:
                          (modal.index - 1 + reference.gallery.length) %
                          reference.gallery.length,
                      })
                    }
                    aria-label={c.prev}
                  >
                    ←
                  </button>
                  <span>
                    {modal.index + 1} / {reference.gallery.length} · {c.archive}
                  </span>
                  <button
                    onClick={() =>
                      setModal({
                        type: "gallery",
                        index: (modal.index + 1) % reference.gallery.length,
                      })
                    }
                    aria-label={c.next}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
            {modal.type === "map" && (
              <div className={s.fullMap}>
                {image(reference.maps[locale], c.mapLabel)}
                <a
                  href={reference.maps[locale]}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.mapOpen} ↗
                </a>
              </div>
            )}
            {modal.type === "film" && (
              <div className={s.videoFrame}>
                <iframe
                  ref={iframe}
                  src={`https://player.vimeo.com/video/${reference.video.vimeoId}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`}
                  title={c.play}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
                <p>
                  {c.archive} ·{" "}
                  <a
                    href={`https://vimeo.com/${reference.video.vimeoId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sl ? "Odpri na Vimeu" : "Watch on Vimeo"} ↗
                  </a>
                </p>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
