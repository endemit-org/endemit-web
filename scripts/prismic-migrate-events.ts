import { migrateDoc, type DocTranslations } from "./prismic-lib";

/**
 * Fills _sl fields on event documents in Koroščina (informal/tikanje). Drafts
 * land in the planned version for review. Already-Slovenian content (e.g. the
 * pod-svobodnim-soncem poem) is intentionally left to fall back to the base.
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-events.ts
 */

const KRIZEV_POEM =
  "Križev pot je predolg,\n" +
  "breme endemitskega umetniškga potenciala\n" +
  "pretežko za eno samo procesijo.\n\n" +
  "Še zmerm brez podalšanga obratovalnga časa\n" +
  "mora pleme svoj križ nest po dveh nadstropjih.\n\n" +
  "Vstajenje čaka tiste,\n" +
  "ki nas bojo pričakali na Kadrovi zadnji postaji.";

const DARKEST_INTRO =
  "Tretjo sezono odpiramo z novo release fešto. Rhaegalova zadnja produkcija je nabrala Darkest and Oddest Shades, in ker je naš ključni endemitski umetnik pa kurator Emit podcasta, je Bobi že začo rudarit za najgloblo pa najbol redko snovjo za svoj novi LP.\n" +
  "Brez warm-upa, brez closinga, brez drugih imen. Sam Rhaegal, brez prekinitve. Pleme prepuščeno Hands of the Creator.";

const EVENTS: Record<string, DocTranslations> = {
  "darkest-and-oddest-shades": {
    type: "event",
    internalName: "Darkest and oddest shades",
    base: { description: DARKEST_INTRO },
    bios: {
      rhaegal:
        "Rhaegal, znan po tem, da koplje za najgloblimi pa najbol redkimi zvoki, si je zgrado sloves izvajalca surovga, brezkompromisnga techna. Njegova zadnja izdaja razskuje najtemnejše pa najbol čudne odtenke njegove produkcije in potiska sound v globlo, bol eksperimentalno teritorijo.\n" +
        "Za ta dogodek ma Rhaegal vse v svojih rokah – set brez prekinitve od začetka do konca. Brez warm-upov, brez podpornih imen; noč je direkten vpogled v njegovo kreativno vizijo. Čista, zbrana izkušnja, pri kateri glasba govori sama zase pa vodi množico skoz njegovo najnovejše delo.",
    },
    slices: {
      0: { primary: { content: DARKEST_INTRO } },
      2: {
        primary: {
          description:
            "Naša kolaboracija s HOTC ob Rhaegalovem novem albumu Darkest And Oddest Shades. LP je razprodan, digitalni album pa majce so še na volo.",
        },
      },
    },
  },
  "krizev-pot": {
    type: "event",
    internalName: "Križev pot",
    base: { description: KRIZEV_POEM },
    bios: {
      conceptual:
        "Conceptual je Poncij Pilat plemena, križar, ki nas bo v glavnih urah obsodil na grajske dvorane. Simone je zgrado glasbeni stil, ki ti odklopi obremenjeno glavo pa telo osvobodi teže znorelga sveta.\n" +
        "Rojen v zibelki rimskga imperija, je vstal od mrtvih v Berlinu, kjer je ustanovo Friendship Collective pa založbo DUNA. Njegove izdaje pri Illegal Alien pa Semantica Records skupej z njegovim progresivnim pristopom k DJ-anju kažejo njegovo predanost deep technu pa eksperimentu.",
      melaniflores:
        "Melaniflores je svetilnik med našo zasedbo moških mučenikov. Privolila je, da vodi procesijo v zgornjem nadstropju in te ogreje s čistimi, globokimi zvočnimi biči, predn tvoje telo stopi v Vinterjev svet bolečine.",
      mmali:
        "MMalijev closing je ko Kristusove besede odrešitve – hkrati jeruzalemske žene, ki ti brišejo pot, pa tujec, ki nese tvoje utrujene noge. Tisti, ki tretjič padejo na začetku čistga techna, bojo vstali za še eno zadnjo rundo, ko je vse dovoljeno.",
      rahul:
        "Križev pot začneš na našem glavnem floru, kjer prvič padeš pod lahko težo Rahulovih razskovalnih groovov. Svoje warm-up sposobnosti je dokazo že dvakrat in Pilata prisilo v dokončno sodbo – Rahul postane naslednji endemitski hišni mučenik.",
      vinter:
        "Vinterjeva postaja v zgornjem nadstropju je tam, kjer te okronajo s trnjem zvoka, tko temnga pa globokga, da boš molil, da bi preskočo na del s križanjem pa se rešo iz primeža neomajnga ritma. Spokori se pred Matijo, pa mogoče prideš do zadnje postaje.",
    },
    slices: { 0: { primary: { content: KRIZEV_POEM } } },
  },
};

async function main() {
  for (const [uid, t] of Object.entries(EVENTS)) {
    console.log(`\n${uid}:`);
    await migrateDoc(uid, t);
  }
  console.log("\nAll events processed.");
}

main().catch(err => {
  console.error("Events migration failed:", err?.message || err);
  process.exit(1);
});
