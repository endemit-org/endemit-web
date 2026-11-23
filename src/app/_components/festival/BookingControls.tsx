"use client";
import { useId, useState } from "react";
import b from "./booking.module.css";

export function Quantity({
  label,
  value,
  min = 0,
  max,
  onChange,
  locale,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
  locale: "en" | "sl";
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const change = (n: number) => {
    const next = Math.max(
      min,
      Math.min(max, Number.isFinite(n) ? Math.trunc(n) : min)
    );
    setDraft(null);
    onChange(next);
  };
  return (
    <div className={b.quantityField}>
      <label htmlFor={id}>{label}</label>
      <div className={b.counter}>
        <button
          type="button"
          disabled={value <= min}
          aria-label={`${locale === "sl" ? "Zmanjšaj" : "Decrease"}: ${label}`}
          onClick={() => change(value - 1)}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? String(value)}
          onChange={e => {
            setDraft(e.target.value);
            const n = e.target.valueAsNumber;
            if (Number.isInteger(n) && n >= min && n <= max) onChange(n);
          }}
          onBlur={e => change(e.target.valueAsNumber)}
          onKeyDown={e => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              change(value + (e.key === "ArrowUp" ? 1 : -1));
            }
          }}
        />
        <button
          type="button"
          disabled={value >= max}
          aria-label={`${locale === "sl" ? "Povečaj" : "Increase"}: ${label}`}
          onClick={() => change(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function PackingIcon({ kind }: { kind: "tent" | "ride" | "wallet" }) {
  return (
    <svg
      viewBox="0 0 100 90"
      aria-hidden="true"
      className={b.packingIcon}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "tent" ? (
        <>
          <path d="M9 73L46 15L88 73L9 73ZM46 15L53 72M53 72L68 73L47 35L28 73M42 9L49 18L53 9M5 79Q46 73 95 80" />
          <path
            d="M66 21l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"
            fill="currentColor"
            stroke="none"
          />
        </>
      ) : kind === "ride" ? (
        <>
          <path d="M15 58L18 23Q18 18 25 18H74Q82 18 82 25L85 58ZM23 28H42V44H21ZM49 28H73V44H49ZM10 66Q50 77 94 65M19 56H81" />
          <circle cx="29" cy="60" r="7" fill="currentColor" />
          <circle cx="72" cy="60" r="7" fill="currentColor" />
          <path d="M6 30H13M3 40H12M88 36L94 30L89 25" />
        </>
      ) : (
        <>
          <path d="M13 33Q45 24 84 30L83 73Q49 80 14 71ZM14 33L25 18L75 19L82 30M67 45L90 44L90 61L67 62Z" />
          <circle cx="77" cy="53" r="2" />
          <circle cx="44" cy="14" r="9" />
          <path d="M41 9L47 19M46 9L40 19M22 47Q36 41 47 47M22 55H39" />
        </>
      )}
    </svg>
  );
}
