import s from "./journey.module.css";

export function Canopy({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`${s.canopy} ${side === "right" ? s.canopyRight : s.canopyLeft}`}
      aria-hidden="true"
    >
      <div className={s.canopyArt} />
      <svg viewBox="0 0 500 900" preserveAspectRatio="none">
        <path
          fill="#f06b43"
          d="M-30 950C140 680 42 414 192 160C228 98 237 33 216-30L252-30C291 107 202 184 182 309C309 191 343 184 445 168C305 248 255 332 173 394C149 486 150 562 119 658C259 546 315 550 433 568C264 591 193 678 96 725L40 950Z"
        />
        <path
          fill="#ab6b91"
          d="M-40 318C73 271 166 196 192 103C76 137 38 194-40 230ZM170 409C289 375 381 289 397 213C279 233 213 321 170 409ZM128 586C253 550 287 479 307 411C201 446 151 491 128 586ZM30 777C175 806 299 771 359 692C225 671 121 706 30 777Z"
        />
        <path
          fill="none"
          stroke="#f7905a"
          strokeWidth="3"
          d="M-10 913Q102 752 120 578T225 99M181 367Q287 275 357 253M99 726Q215 728 290 709"
        />
      </svg>
    </div>
  );
}

export function RiverThread() {
  return (
    <div className={s.riverThread} aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <svg key={i} viewBox="0 0 1440 2000" preserveAspectRatio="none">
          <path
            d="M720-40C1250 210 1180 475 665 600S150 1030 640 1190S1240 1630 720 2040"
            fill="none"
            stroke="#aa91b4"
            strokeWidth="190"
            opacity=".16"
          />
          <path
            d="M710-40C1210 210 1140 475 655 600S180 1030 650 1190S1220 1630 710 2040"
            fill="none"
            stroke="#e9ac8d"
            strokeWidth="2"
            opacity=".45"
          />
          <path
            d="M680-40C1160 210 1090 475 625 600S230 1030 680 1190S1170 1630 680 2040"
            fill="none"
            stroke="#e9ac8d"
            strokeWidth="1"
            strokeDasharray="3 13"
            opacity=".7"
          />
        </svg>
      ))}
    </div>
  );
}

export function Passage({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <section className={s.passage} data-reveal>
      <div className={s.passageInside}>{children}</div>
      <div className={s.passageLeft} aria-hidden="true">
        <Canopy side="left" />
      </div>
      <div className={s.passageRight} aria-hidden="true">
        <Canopy side="right" />
      </div>
      <p className={s.pathNote}>
        {label} <span>↘</span>
      </p>
    </section>
  );
}
