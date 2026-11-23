export type FestivalPhoto = { slug: string; w: number; h: number };

const photo = (slug: string, w: number, h: number): FestivalPhoto => ({ slug, w, h });

/** Every photograph on the gallery wall, in wall order. Sizes are the full files. */
export const GALLERY: FestivalPhoto[] = [
  photo("smoke-dance-2", 1280, 853),
  photo("blue-beam", 853, 1280),
  photo("river", 1024, 768),
  photo("teal-crowd", 1280, 853),
  photo("sunbeam-tree", 853, 1280),
  photo("disco", 768, 1024),
  photo("drava-meadow", 768, 1024),
  photo("blue-floor", 1280, 853),
  photo("grass-crew", 1280, 853),
  photo("violet-beam", 853, 1280),
  photo("watermelon", 1280, 853),
  photo("night-bar", 1280, 853),
  photo("dancers", 914, 1280),
  photo("purple-laser", 853, 1280),
  photo("fog-tree", 768, 1024),
  photo("pink-sky", 1280, 596),
  photo("smoke-dance-1", 1280, 853),
  photo("green-laser", 571, 1280),
  photo("sign-tree", 853, 1280),
  photo("lantern-line", 1280, 853),
  photo("meadow-dome", 1024, 768),
  photo("teal-light", 853, 1280),
  photo("backlight", 1280, 853),
  photo("silhouettes", 853, 1280),
  photo("drava-bank", 768, 1024),
  photo("green-dome", 1280, 853),
  photo("smoke-figure", 853, 1280),
  photo("blue-wide", 1280, 553),
  photo("curtain-path", 853, 1280),
  photo("laser-dome-3", 768, 1024),
  photo("blue-smoke", 1024, 768),
  photo("decks", 1280, 853),
  photo("hall", 1024, 768),
  photo("glow-creatures", 1280, 853),
  photo("afternoon-floor", 1280, 853),
  photo("lantern-path", 768, 1024),
  photo("smoke-dance-3", 1280, 853),
  photo("lanterns", 853, 1280),
  photo("dome-dj", 1280, 853),
  photo("sign-meadow", 768, 1024),
  photo("smoke-jump", 853, 1280),
  photo("melon-slices", 1280, 853),
  photo("dome-frame", 768, 1024),
  photo("white-curtain", 853, 1280),
  photo("tent-view", 1280, 960),
  photo("dome-day", 1024, 768),
  photo("sign-sun", 1280, 853),
  photo("booth", 1280, 853),
  photo("laser-dome-1", 792, 992),
];

const bySlug = new Map(GALLERY.map(item => [item.slug, item]));

export function findPhoto(slug: string): FestivalPhoto {
  const found = bySlug.get(slug);
  if (!found) throw new Error(`Unknown festival photo: ${slug}`);
  return found;
}

/** The grounds, the river and the woods around them. */
export const PLACE = ["river", "fog-tree", "drava-meadow", "hall", "lantern-path", "drava-bank", "meadow-dome", "dome-frame", "sign-meadow"].map(findPhoto);
