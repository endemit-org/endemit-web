/** Local Endemit footage only. Originals stay untouched; loop audio is deliberately removed. */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const directory = "/Users/nejc/Desktop/em/Devdemit";
const target = "public/images/festival/motion";
mkdirSync(target, { recursive: true });
const clips = [
  ["forest", "Endemit 2025 Teaser 4K.mp4", 0, 9, 960],
  ["dance", "IMG_2892.mov", 3, 9, 432],
  ["lights", "IMG_2876.MOV", 2, 9, 432],
  ["signal", "IMG_3007.MOV", 1, 7, 432],
];
for (const [name, file, start, duration, width] of clips) {
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    String(start),
    "-i",
    `${directory}/${file}`,
    "-t",
    String(duration),
    "-an",
    "-vf",
    `scale=${width}:-2,fps=24`,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    `${target}/${name}.mp4`,
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    `${target}/${name}.mp4`,
    "-frames:v",
    "1",
    `${target}/${name}.jpg`,
  ]);
  console.log(name);
}
writeFileSync(
  `${target}/sources.json`,
  JSON.stringify(
    {
      purpose:
        "Muted, short ambient loops for the local festival journey. Documentary archive, not current-year lineup announcements.",
      clips: clips.map(([name, file, start, duration, width]) => ({
        output: `${name}.mp4`,
        source: `~/Desktop/em/Devdemit/${file}`,
        start,
        duration,
        width,
        audio: false,
      })),
      excluded: ["Rave On media", "Blender files", "historical artist audio"],
    },
    null,
    2
  ) + "\n"
);
