"use client";

import dynamic from "next/dynamic";

/**
 * Client-side gate for the Vfx slice's WebGL scenes. Each scene statically
 * imports three, so it MUST only be reached through this ssr:false dynamic
 * import (see the bundle isolation contract in theme/webgl/) — pages without
 * a Vfx slice never download three.
 */
const RaveonVfxScene = dynamic(
  () => import("@/app/_components/theme/webgl/RaveonVfxScene"),
  { ssr: false }
);

export type VfxKind = "Rave On";

export default function VfxCanvas({ vfx }: { vfx: VfxKind }) {
  switch (vfx) {
    case "Rave On":
      return <RaveonVfxScene />;
    default:
      return null;
  }
}
