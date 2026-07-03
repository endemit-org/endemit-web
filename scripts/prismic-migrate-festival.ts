import "dotenv/config";
import * as prismic from "@prismicio/client";

/**
 * Fills ALL Slovenian (_sl) fields on the endemit-festival-2026 event in
 * Koroščina. Artist bios + the poetic intro are the client's canonical copy;
 * functional slice copy (tickets/wallet/newsletter) is rendered in the same
 * voice. Base fields + internal name preserved. RichText fields -> block arrays,
 * KeyText fields -> strings (see field types verified from the models).
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-festival.ts
 */
const WRITE_TOKEN = process.env.PRISMIC_WRITE_TOKEN!;
const REPO = process.env.PRISMIC_REPOSITORY_NAME || "endemit";
const INTERNAL_NAME = "Endemit festival '26";

const rt = (text: string): prismic.RichTextField =>
  text
    .split("\n")
    .map(t => ({ type: "paragraph", text: t, spans: [] })) as prismic.RichTextField;

// Single heading1 block (Hero heading field only allows heading1).
const h1 = (text: string): prismic.RichTextField =>
  [{ type: "heading1", text, spans: [] }] as prismic.RichTextField;

// Poetic festival intro (client copy) — used for both the description and the poem slice.
const INTRO = rt(
  "Endemitsko poletje bo vnebohod plemena, kero bo tekvo s še bol jasnim korakom do vrha. Tok, ko smo ga pognali po libeliški dolini, je postav močnejši od stvarnika in letos še bol vleče nazaj k izviro, tja ko se zvok zlije z divjino odzuna in v tbi.\n" +
    "Prpraj se na več, ko pa lahko sam preneseš. Zato ne posti kolegov zada."
);

// Canonical artist bios (client copy), keyed by artist uid.
const BIO_BY_UID: Record<string, string> = {
  "adriana-lopez":
    "Adriana je dčva, ki je orala tehno ledino na kolumbijski sceni in pred dvajsetimi leti osvojila še evropsko celino. Svoj drugi dom si je na tti strani oceana porihtava v tmnih dvoranah Berghaina, njena produkcija pa je našla zavetje pri založbah tavlkega kova, tko je Semantica.\n" +
    "Z inženirsko preciznostjo in progresivnim skladanjem čistih in globokih soundov bo pleme prifurala skoz taglavni odsek endemitskega vnebohoda, brez da bi koga vrglo iz ritma na floro.",
  "alan-backdrop":
    "Allesio je sosed iz Padove, ki se nam je vtisno v spomin s svojo emocionalno, melodično produkcijo in tstim redkim talentom mešanja žanrov, ki izzivajo meje tehna. Njegove izdaje te enkrat presenetijo z ambientalo, drugič s trance-om, zmerm pa z dodelanim konceptom in frišno vizijo umetnika z vlko začetnico. Ker ga je izven studijskih soban in bk od sintov bol tžko ujet ko pa endemitka na plesiščo, je Allesio za mešalko skor tko sončev mrk – enkratni pojav, kerga ne smeš zamudit.",
  "jasa-buzinel":
    "Jaša je glasbeni novinar, sokurator Sonice, vodja ljubljanskega Cosmic Sex kolektiva z rezidenco v klubo Channel Zero, s kerim bomo prekrižali poti za dnevno varjanto vnebohoda, ko si bo pleme zalizavo rane z miksom plesnih žanrov. Kot izkušen perfomer na Butiko in Mento je Jaša točno tsti del sestavlanke, ki bo dopovno festivalsko sliko s poletnim vajbom.",
  "material-object":
    "Andrew je naš mate iz Avstralije, ker ma že status seniorja v eksperimentiranjo z abstraktnimi in psihedeličnimi prvinami tehna. Skoz vse zvočne pore je začno potovat že ko froc, ki je zraso gr na konco svta in nagrunto, da ga bo orginalni sound enkrat poplo okrog oble. Tk ga je po letih produceranja in live-performansov po vseh tavlkih klubih in festivalih zanesvo v našo podalpsko deželo, kjer je sposto nove korenine in bo že drugič s svojo ambientalo razsvtlo koroško šumo.",
  vermisst:
    "Vermisst je definicija nove generacije umetnikov z jasno kreativno špuro, kera seka čez ambientalo do globin tehna in zmerm najde težišče v kaoso ritmično melodičnih vzorcov. Teo bo s svojim setom segrev atmosfero na tazadni večer in na stržaj ofno vrata v vesolje endemitskim vnebohodnikom.",
  "mozer-b2b-beko":
    "Beko bo letos prplo okrepitve iz Zagreba in soočo svoje progresivne note z Mozerjevim minimalizmom in hipnozo. Brata Hrvata sta oba starešini zagrebškega podzemlja, Mozer pa se je na elektronski sceni rolo še predn smo mi odkrili dvorano Rog. Hrbet si bota kriva že prvo noč endemitskega vnebohoda, ko bota pleme popelava skoz svoj ritmični, napet odsek vzpona.",
  "isabel-soto":
    "Isabel je venezuelska tehno princesa z berlinsko vižo, ki je svoj neizumetničen ritmični stil razvijava na odprti sceni Montreala. Njene stvaritve so kombinacija abstraktnih vzorcov in globokih udarcov, s kerimi zna potisnt človeka do roba emocij.\n" +
    "S svojo založbo NYXII Records in vinilno izdajo pri Ostgut Ton je v širnem podzmljo našva svoj prostor pod soncom, njen vzpon pa ni noben marketinški trik, ampak rezultat tega, da se zmerm da co - za vsak komad, vsak set, en vnebohod za drugmo.",
  svarog:
    "Oleksa je ukrajinski borc za mir, ki je skoz desetletje izkušn in preizkušn preraso svoj prvotni umetniški jaz. Če je prej isko smisel v misticizmo, simbolizmo in se držo jasno začrtane špure, se dans zna prepostit naravnemo toko zvoka, ki ga nosi bol ko pa on usmerja njega.\n" +
    "Zj ko je že osvojiv tavkle založbe, tko sta Semantica in Affin, Svarog ni več karaktr na sceni niti mitološko bitje - je mojstr svoje obrti, ki je izoblado zlaganje hipnotičnih vzorcov. Če smo meli pred davnimi leti srečo sred koroške šume čut njegov stari jaz, se letos v Libeliče vrača z novim izrazom.",
  obscur:
    "Obscur je endemitska zvezda, kera vse bol sveti na vseh straneh neba naše celine. Tim je s svojim soundom dorasto kundije in s produciranjem progresivnih, psihedelično začinjenih komadov izkazo jekleno volo pri iskanjo novih zvočnih dimenzij, kar so opazli tut pri založbah Modularz, Paralelo in Moving Pressure.\n" +
    "Njegovo umetniško rast nismo mogli spregledat niti pri letošnjem razporejanjo odsekov našega vnebohoda, zato bo dobo eno od častnih zaklučnih pozicij.",
  rahul:
    "Rahul je najmlajši in najbol lojaln član endemitske familije, ki se je prpravlen obrnit na glavo za vsak skupn cilj. Za mešalko tžko prikrije svoje orientalske korenine, ker tam zmerm koplje po motivih, soundih in žanrih, ki si jih je shrano na poti od Bakuja do Berlina.\n" +
    "S svojo drugo familijo RÆHAT, ki je sicr njegova prva, ma čez tmna skladišča slovenskega pristanišča, ko je v endemitskem skrbništvo pa se zmerm izkaže s kreativnimi seti, skoz kere nam pove, na ka vse študera pa kk rad nas ma pa cev svt okol sbe.",
  "mmali-b2b-rhaegal":
    "Po testiranjo endemitskih b2b kombinacij je padva komanda, da morta z novim zgodovinskim setom vnebohod spt zaklučit orginalna gangstrja z Ravn in Šoštanja. Matej pa Bobi sta tko dan pa noč - taprvi s svojimi melodijami, basi in pisanimi žanri najbol zasije za froštik, tadrug pa najrajš v nočni smeni rudari za redkimi kovinami v najglobljih rovih. Kr improvizacija nobenmo ni španska vas in nas še nikol nista postva na cedilo, sta bva izbrana, da preverita trdnost plemena in odrešita vse Marije pocestniških grehov.\n" +
    "Referendum na letošnjo izbiro dvojic je protiustavn — njun closing je temelj endemitskega prava, davk na telo pa skladn s fiskalnimi pravili.",
};

// Slice _sl overrides by index. RichText fields use rt(); Text fields use strings.
const SLICE_SL: Record<number, { primary?: Record<string, unknown>; items?: Record<string, unknown>[] }> = {
  0: {
    primary: {
      heading_sl: h1("Druga runda kart"),
      description_sl: rt("Zadnja runda kart po znižani ceni, pohiti. Od 14. do 16. avgusta."),
    },
  },
  1: { primary: { content_sl: INTRO } },
  4: {
    primary: {
      content_sl: rt(
        "ZUNA JE DRUGA RUNDA KART – ČAS TEČE\n" +
          "Early bird in prva runda sta razprodana, pohiti po zadnjo rundo po znižani ceni za naše snidenje 2026 v Libeličah. Letos smo nagruntali par nadgradenj, da ti bo lažje. Uredi svojo digitalno denarnico za brezgotovinska plačila – pijačo, hrano pa merch na prizorišču plačaš kar z zapestnico.\n" +
          "Vse karte vključujejo šotorjenje na območju festivala za đabe 🏕"
      ),
    },
  },
  8: {
    primary: {
      heading_sl: "Rundi kart",
      subheading_sl:
        "Posebne ponudbe v omejenih rundah; early bird in prva runda sta razprodana, druga runda pa je še zmerm zuna po omejenih cenah.",
    },
    items: [
      { title_sl: "Early bird (razprodano)", description_sl: "Prvih 50 kart" },
      { title_sl: "Prva runda (razprodano)", description_sl: "Javna prodaja" },
      { title_sl: "Druga runda", description_sl: "Zadnji spletni klic" },
      { title_sl: "Za oba dneva, drugi dan 50 %", description_sl: "Na vhodu" },
    ],
  },
  10: {
    primary: {
      title_sl: "Napoln svojo digitalno denarnico",
      description_sl:
        "Prpravi denarnico za pijačo, hrano, merch pa druge drobnarije. Konc izletov na bankomat, ko zmanka gotovine.",
    },
  },
  11: {
    primary: {
      content_sl: rt(
        "Da bo hitro pa fajn, mamo letos svoj brezgotovinski EndePay sistem, ki poganja vsa plačila na festivalu. Preber več o denarnici."
      ),
    },
  },
  15: {
    primary: {
      override_title_sl: "Bodi na tekočem o naslednji rundi",
      override_description_sl:
        "Naroč se pa bodi med prvimi, ki jih zbudimo, ko pade naslednja runda kart.",
    },
  },
};

async function main() {
  const client = prismic.createWriteClient(REPO, {
    writeToken: WRITE_TOKEN,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  const doc = await client.getByUID("event", "endemit-festival-2026");
  const data = doc.data as Record<string, unknown>;

  data.description_sl = INTRO;
  data.annotation_sl = "prva runda";

  const artists = (data.artists as Record<string, unknown>[]) ?? [];
  let filled = 0;
  const missed: string[] = [];
  for (const a of artists) {
    const link = a.artist as { uid?: string } | undefined;
    const uid = link?.uid;
    const bio = uid ? BIO_BY_UID[uid] : undefined;
    if (bio) {
      a.description_override_sl = rt(bio);
      filled++;
    } else if (uid) {
      missed.push(uid);
    }
  }
  console.log(`Filled ${filled} artist bios. No bio for:`, missed.join(", ") || "none");

  const slices = (data.slices as Record<string, unknown>[]) ?? [];
  slices.forEach((s, i) => {
    const ov = SLICE_SL[i];
    if (!ov) return;
    if (ov.primary) s.primary = { ...(s.primary as object), ...ov.primary };
    if (ov.items) {
      const items = (s.items as Record<string, unknown>[]) ?? [];
      ov.items.forEach((it, j) => {
        if (items[j]) items[j] = { ...items[j], ...it };
      });
    }
  });
  console.log("Applied slice overrides for:", Object.keys(SLICE_SL).join(", "));

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, INTERNAL_NAME);
  await client.migrate(migration, {
    reporter: e => console.log("[migrate]", e.type ?? e),
  });

  console.log("\nDone — festival document fully localized in the planned version.");
}

main().catch(async err => {
  console.error("Festival migration failed:", err?.message || err);
  if (err?.response) {
    try {
      const body =
        typeof err.response.json === "function"
          ? await err.response.json()
          : err.response;
      console.error("Response detail:", JSON.stringify(body, null, 2).slice(0, 2000));
    } catch {
      console.error("Raw response:", err.response);
    }
  }
  process.exit(1);
});
