import { notFound } from "next/navigation";

// Catches any path not matched by a concrete localized route and renders the
// localized 404 (src/app/[locale]/not-found.tsx). Required because there is no
// global root layout / not-found once the app uses per-group root layouts.
export default function CatchAllPage() {
  notFound();
}
