import "dotenv/config";
import * as prismic from "@prismicio/client";
import { createClient, migrateDoc, type DocTranslations } from "./prismic-lib";

/**
 * Localizes inner_content pages (Koroščina) into their planned version.
 *
 * Most docs carry a `content_section` (or `poem`) slice whose `content` field is
 * a rich-text block array mixing headings, paragraphs AND images. We rewrite the
 * text of heading/paragraph blocks index-by-index while keeping IMAGE blocks
 * verbatim — `null` in a translation array means "keep the source block whole"
 * (covers images, empty spacers, and universal text like Japanese tracklists).
 *
 * festival-2026-endepay has no content_section text — its product_list + accordion
 * slices are handled with the standard field mechanism (see ENDEPAY below).
 *
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-inner-content.ts
 */

type Blocks = (string | null)[];
type InnerDoc = {
  uid: string;
  internalName: string;
  titleSl?: string | null; // null/omitted → title stays universal
  slices: Record<number, Blocks>; // slice index → block translations (index-aligned)
};

/** Image-safe block-preserving migration for a content_section/poem doc. */
async function migrateInner(d: InnerDoc) {
  const client = createClient();
  const doc = await client.getByUID("inner_content" as never, d.uid);
  const data = (doc as { data: Record<string, unknown> }).data;

  if (d.titleSl != null) data.title_sl = d.titleSl;

  const slices = (data.slices as Record<string, unknown>[]) ?? [];
  for (const [idxStr, blocksSl] of Object.entries(d.slices)) {
    const s = slices[Number(idxStr)];
    if (!s) throw new Error(`${d.uid}: no slice at index ${idxStr}`);
    const primary = (s.primary as Record<string, unknown>) ?? {};
    const source = (primary.content as { type: string; text: string }[]) ?? [];
    if (blocksSl.length !== source.length) {
      console.warn(
        `  ⚠ ${d.uid} slice[${idxStr}]: ${blocksSl.length} translations vs ${source.length} source blocks`
      );
    }
    primary.content_sl = source.map((b, i) =>
      blocksSl[i] != null ? { type: b.type, text: blocksSl[i], spans: [] } : b
    );
    s.primary = primary;
  }

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, d.internalName);
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ ${d.uid} (planned version)`);
}

const MAP_TIMETABLE_PARA =
  "Skoz našo začarano dolino se sprehodi ko popotniki pred tabo, sam z modrostjo, da točno veš, kam si namenjen. Naš festivalski zemljevid ti razkrije gaje pa vse dobrine za tvoje bivanje, skrbno spleten urnik pa poskrbi, da uloviš vsakga izvajalca in uživaš v čarobnih kotičkih naše divjine ravno ob pravem cajtu.";

const DOCS: InnerDoc[] = [
  {
    uid: "festival-25-map-timetable",
    internalName: "festival-25-map-timetable",
    titleSl: "Zemljevid & urnik",
    slices: {
      0: [
        "ZEMLJEVID & URNIK",
        MAP_TIMETABLE_PARA,
        "ZEMLJEVID",
        null,
        "URNIK",
        null,
      ],
    },
  },
  {
    uid: "festival-2026-accommodation",
    internalName: "festival-2026-accommodation",
    titleSl: "Prenočišče",
    slices: {
      0: [
        "Kampiranje",
        null,
        "Festival se najlepš doživi v družbi, kar med festivalskim prostorom \n🏕 (vse vstopnice že vključujejo kampiranje).\n",
        "Hoteli & apartmaji",
        null,
        "Hotelska nastanitev je na volo v omejenih količinah v Hotelu Korošica ★★★★. Če pohitiš, najdeš morda tut kakšen apartma v bližini na Googlu, Bookingu ali drugih straneh.\n",
        "Avtodomi",
        null,
        "Če prideš z avtodomom, je pri vhodu na festivalski prostor na volo 6 občinskih mest s priklopom na komunalo za simbolično ceno.",
      ],
    },
  },
  {
    uid: "festival-2026-food-drinks",
    internalName: "festival-2026-food-drinks",
    titleSl: "Hrana & pijača",
    slices: {
      0: [
        "Hrana",
        "Letos se vrača — hrana pride naravnost z vrta pa iz hlevov Hiše Rener, našga ljubljenga koroškga gostitelja pa njegove družine. Gremo nazaj k osnovam: oživlamo legendarni koroški burger pa dodajamo sveže specialitete iz tradicionalnih sestavin.",
        null,
        "Med kosilom pa zajtrkom bojo na volo mesne pa vegetarijanske opcije. Meni z natančnimi jedmi objavimo tukej v dnevih pred festivalom. ",
        "Vsa hrana bo plačljiva izključno z EndePay.\n",
        "Pijača",
        "Kar se tiče pijače, bomo v enako dobrih rokah. Kristjan pa njegova ekipa, praktično že družina, bojo držali trdnjavo dan pa noč za šankom. Sočne, močne ali suhe osvežitve bojo postrežene mrzle, zmerm s posebnim twistom in tistim značilnim nasmehom, ki ga ekipa zmerm prinese zravn.",
        null,
        "Vsa pijača bo plačljiva izključno z EndePay.",
      ],
    },
  },
  {
    uid: "festival-2026-orientation",
    internalName: "festival-2026-orientation",
    titleSl: "Zemljevid",
    slices: {
      0: [
        "Zemljevid & urnik",
        MAP_TIMETABLE_PARA,
        "ZEMLJEVID",
        null,
        null,
        "URNIK",
        "Urnik bo na volo, ko bojo objavlene vse serije informacij o izvajalcih. Ostani z nami.",
      ],
    },
  },
  {
    uid: "x-accommodation",
    internalName: "x-accommodation",
    titleSl: "Prenočišče",
    slices: {
      0: [
        "PRENOČIŠČE",
        "Kamp obkroža cel prizor, tko da vsak najde svoj popolni kotiček. Počuti se ko doma, ampak da ohraniš harmonijo s sosedi, prosim spoštuj pravila narave pa ohranaj prostor čist.",
        null,
        null,
        null,
        null,
        "Za avtodome je na volo namensko parkirišče (z električnimi priključki) po sistemu kdor prej pride, prej melje – zakon narave!",
        "Za tiste, ki iščejo več udobja, priporočamo bližnje nastanitve ko so Hotel Korošica, prenočišča Ta Fabrika, Hostel Punkl in druge. Kar javi se, če rabiš pomoč pri iskanju popolnga kotička.",
        null,
        "STRANIŠČA IN PRHE",
        "Prijetna pa čista stranišča in prhe ti ponujajo udobne pa zasebne prostore za osebno higieno. Objekt stoji ob potoku, zgrajen je iz lesa in ponuja čist drugačno izkušno, ko si je navajen s podobnih dogodkov.",
        "Ti objekti so pravilno vzdrževani pa redno čiščeni, da je za vse zagotovlena higiena pa udobje.",
        "Pri prhanju bodmo varčni z vodo, da lahk vsak uživa v objektih — pazmo, kok je porabmo.",
        null,
        null,
      ],
    },
  },
  {
    uid: "festival-25--food-drinks",
    internalName: "festival-25--food-drinks",
    titleSl: "Hrana & pijača",
    slices: {
      0: [
        "Hrana in pijača",
        "Letos pride hrana naravnost z vrta pa iz hlevov Hiše Rener, našga ljubljenga koroškga gostitelja pa njegove družine. Gremo nazaj k osnovam: oživlamo legendarni koroški burger pa dodajamo sveže specialitete iz tradicionalnih sestavin.",
        null,
        "Mesojedci bojo lahk uživali v kesadijah, polnenih s piščancem, doma pridelano zelenjavo pa začimbami, ali pa si ogrejejo trebuh pa srce s posebnim Renerjevim mesnim golažom. In ko po navadi bomo za zajtrk razbili nekej jajc: eno za dame pa dve za velke fante.",
        "Tut vegetarijanske opcije bojo tuki. Mehke bao žemlke, polnene s humusom, svežo solato pa čičerkino pleskavico (v stilu falafla), bojo dobr izgovor, da naročiš še porcijo pomfrija zravn.",
        "Kar se tiče pijače, bomo v enako dobrih rokah. Kristjan pa njegova ekipa, praktično že družina, bojo držali trdnjavo dan pa noč za šankom. Sočne, močne ali suhe osvežitve bojo postrežene mrzle, zmerm s posebnim twistom in tistim značilnim nasmehom, ki ga ekipa zmerm prinese zravn.",
        null,
      ],
    },
  },
  {
    uid: "x-info",
    internalName: "x-info",
    titleSl: "Info",
    slices: {
      0: [
        "VREME",
        "Glede na nepredvidlive vremenske vzorce pa prihajajočo polno luno v ponedelek je pametno bit pripravlen na nepričakovano. Zaradi reke lahk tut v najbolj vročih dnevih temperature po sončnem zahodu močno padejo. Zato je priporočlivo spakirat toplo obleko pa dežni plašč za primer dežja. Pa ne pozab na kremo za sončenje z visokim SPF 50, da se čez dan zaščitiš pred sončnimi žarki.",
        null,
        null,
        null,
        null,
        null,
        "Za vsak slučaj spakiraj nepremočlivo obleko pa se izogibaj postavlanju šotorov na nižje ležečih območjih ob reki. Ne pozab, mi objememo vsako vreme, tut dež.",
        null,
        "BANKOMAT / BENCINSKA / TRGOVINA",
        "Upoštevaj, da na [X] snidenju ali v bližnjih vaseh ni bankomatov. Najbliži bankomat najdeš v Dravogradu, kakih 5 km stran. Priporočamo, da dvigneš gotovino pred prihodom. Se pa zmerm najde kakšna radodarna duša, ki je pripravlena zamenjat dobrine, če rabiš. Pa tut bencinske, trgovine pa druge dobrine niso na volo na kraju samem ali v okolici. Pametno se je ustavit v Dravogradu, da nabaviš vse potrebno pa prideš pripravlen na svoje bivanje.",
        "SKRB ZA NARAVO",
        "Cigaretne ogorke, pločevinke, plastiko pa vse ostale odpadke odvrzi v za to namenjene koše ali pepelnike. Ne lulaj pa kakaj v naravi; raj si vzem cajt pa se sprehodi do stranišč. S spoštovanjem narave pa čistočo okolice prispevamo k prijetnemu okolju za vse.",
        "TAKSI",
        "Taksiji v tem delu Slovenije niso lahk doseglivi. Če pa rabiš prevoz do (na primer od hotela) ali od kampa, se lahk obrneš na Sajo ali Ferda. Taksi Saja: +386 (0) 70 211 390 Taksi Ferdo: +386 (0) 70 900 300 Lahk pa se obrneš tut na sotrpine, ki ti morda prijazno ponudijo prevoz za krajše razdalje. Ta občutek skupnosti nas vse še bolj poveže.",
        "PAZI NA REKO DRAVO ZARADI MOČNIH TOKOV ⚠️",
        "Zavedaj se, da je kampiranje ob reki pa kopanje v njej strogo prepovedano. Reka Drava je lahk izjemno nevarna zaradi močnih tokov pa vrtincev. Dajmo dat varnost na prvo mesto, tko da pazmo nase pa na sotrpine. Nočmo, da bi kdo zašel v Dravo, pa da bi naše luči pa zvok med vrhunci našga snidenja tekli neprekinjeno. Mislmo drug na drugga in ustvarmo varno pa prijetno okolje za vse.",
        null,
        "PRIHOD IN ODHOD",
        "Ko prideš na parkirišče, prosim parkiraj svoje vozilo ali plovilo tko, da izkoristiš čim več prostora pa ne oviraš drugih. Prosimo, da greš naravnost skoz portal pa se ne zadržuješ na parkirišču. V bližini so tri stanovanjske hiše in želmo čim manj motit lokalno skupnost pa zmanjšat tveganje, da bi pritegnili neželeno pozornost.",
        "Izhod iz prizora ni zaželen, zato te prosimo, da vstopiš pa odideš z diskretnostjo pa učinkovito. Izogibaj se zadrževanju pa pogovorom o zunanjih zadevah, ko si enkrat notr. Preveri, da imaš vse svoje stvari, vključno z opremo, obleko pa vsem za menjavo.",
        "Naši varnostniki pri vhodu so tam, da poskrbijo za varnost vseh. Prosim, spoštuj jih pa upoštevaj njihove nasvete. Kršenje pravil lahk privede do odstranitve s prizora po Endemit kodeksu. Dajmo skupej ustvarit varno pa harmonično okolje za vse obiskovalce.",
        "Udeležba na snidenju je na lastno odgovornost. Z udeležbo vsak obiskovalec sprejme pravila organizatorjev pa je osebno odgovoren za svoja dejanja pa posledice.",
        "Za vse dodatne informacije nas kontaktiraj prek Facebooka ali e-pošte.",
        "Srečno na poti pa se vidmo kmal!",
      ],
    },
  },
  {
    uid: "issun-boshi-vinyl-release-album-page",
    internalName: "issun-boshi-vinyl-release-album-page",
    titleSl: "O EP-ju",
    slices: {
      0: [
        null, // "Tracklist" — universal
        null, // Japanese tracklist — universal
        null,
        null,
        null, // "Endemit I" — title, universal
        "Desetletje vojn — s samim sabo,\ns hrupom,\ns tišino.",
        "Eni glasovi so me gnali naprej,\ndrugi so me poskušali povleč nazaj,\nampak peščica ni pustila, da odneham.",
        "Cajt te nauči,\nda nič ni nikol zares končano.\nEdino vprašanje, ki ostane, je,\nkakšen odmev pustiš za sabo?",
        "To obstaja zaradi tebe.\nTistih, ki so poslušali, ko so bili sam še drobci.\nTistih, ki so mi dali vetra, ko sem rabil ogenj.\nTistih, ki so stali ob meni v nevihti pa rekli: »Kar naprej.«",
        "Hvala. Zdej — začnemo.",
      ],
    },
  },
];

// festival-2026-endepay: no content_section text; localize product_list + accordion.
// Accordion phrasing mirrors the EndePay FAQ already written in
// scripts/prismic-migrate-content-pages.ts for consistency. Title "Endepay" is
// a universal brand name → left untouched.
const ENDEPAY: DocTranslations = {
  type: "inner_content",
  internalName: "festival-2026-endepay",
  slices: {
    1: {
      primary: {
        title: "Napolni denarnico",
        description: "Pripravi denarnico za nakup pijače, hrane, mercha pa drugih drobnarij",
      },
    },
    2: {
      items: [
        {
          title: "Kaj je EndePay?",
          content:
            "EndePay je brezgotovinski način plačila na festivalu. Z njim kupiš pijačo, hrano, merch pa druge posebne ponudbe na festivalu. In ja, uporabiš ga lahk za napitnino. 100 % napitnine gre osebju, ki je izvedlo transakcijo.",
        },
        {
          title: "Kako napolnim svoje stanje?",
          content:
            "Svoje EndePay stanje napolniš spletno s kreditno kartico, Apple Pay ali Google Pay. Polnjenje s kartico je na volo pred pa med festivalom, stanje pa lahk napolniš tut na dogodku na naši Merch stojnici z gotovino. Stanje lahk zmerm preveriš na svojem registriranem Endemit profilu.",
        },
        {
          title: "Kakšen je menjalni tečaj za ǝŧ?",
          content:
            "Preprosto, 1 € = 1 ǝŧ (Endemit žeton). Nič računanja ni treba.",
        },
        {
          title: "Kaj se zgodi z neporablenim stanjem denarnice?",
          content:
            "Preostalo stanje lahk porabiš na naslednjem dogodku s podporo EndePay ali pa na strani endemit.org za nakup vstopnic, mercha, albumov ali za donacije. Stanje lahk porabiš v celoti ali delno za prihodnje nakupe – ampak upoštevaj, da vračilo denarja ni mogoče.",
        },
      ],
    },
  },
};

async function main() {
  console.log("Inner content:");
  for (const d of DOCS) {
    console.log(`\n${d.uid}:`);
    await migrateInner(d);
  }
  console.log(`\nfestival-2026-endepay:`);
  await migrateDoc("festival-2026-endepay", ENDEPAY);
  console.log("\nInner content done.");
}

main().catch(err => {
  console.error("Inner content migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
