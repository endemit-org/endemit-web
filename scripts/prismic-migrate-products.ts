import "dotenv/config";
import * as prismic from "@prismicio/client";
import { createClient, formatSliceField } from "./prismic-lib";

/**
 * Localizes product documents (Koroščina) into the planned version.
 *
 * - Plain text fields (title/special_notice/checkout_description) → `<f>_sl`.
 *   Album titles + album-name checkout descriptions are proper names → left
 *   universal (omitted from `text`).
 * - `description` rich text → `description_sl`, block-preserving: heading/paragraph
 *   text rewritten index-aligned; `null` keeps the source block whole (tracklist
 *   list-items, Japanese track names, empty spacers stay universal).
 * - Wallet top-ups carry an EndePay FAQ `accordion` (slice[0]) → localized with the
 *   same phrasing as the inner-content/content-page migrations.
 *
 * `internalName` is the document's current English title so the editor name is
 * preserved (passing a different title renames the doc).
 *
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-products.ts
 */

type ProductDoc = {
  uid: string;
  internalName: string;
  text?: Record<string, string>; // KeyText field -> sl string
  description?: (string | null)[]; // block-aligned; null keeps source block
  walletFaq?: boolean; // fill slice[0] accordion with the EndePay FAQ
};

// EndePay FAQ, identical phrasing to the inner-content / content-page migrations.
const FAQ: { title: string; content: string }[] = [
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
    content: "Preprosto, 1 € = 1 ǝŧ (Endemit žeton). Nič računanja ni treba.",
  },
  {
    title: "Kaj se zgodi z neporablenim stanjem denarnice?",
    content:
      "Preostalo stanje lahk porabiš na naslednjem dogodku s podporo EndePay ali pa na strani endemit.org za nakup vstopnic, mercha, albumov ali za donacije. Stanje lahk porabiš v celoti ali delno za prihodnje nakupe – ampak upoštevaj, da vračilo denarja ni mogoče.",
  },
];

const TICKET_DESC: (string | null)[] = [
  "Letno snidenje plemena je bilo vklesano v kamen že pred več ko desetletjem. Odraščali smo z njim, tok ko je on odraščal z nami, in flow, ki smo ga ustvarli po poti, ostaja močan ko zmerm.",
  "Letos se gibljemo s polno odločnostjo. Noben cilj ni previsok, noben zvok premočan. Beseda bo potovala daleč, da prikliče pretekle pa prihodnje prijatle nazaj v tisto ukročeno divjino, kjer se glasba popolnoma poravna z okoljem pa stanjem našga uma.",
  "Pričakuj več, ko lahk preneseš – pripeli druge s sabo.\n\nVstopnica vključuje dovoljenje za kampiranje znotraj festivalskga prostora 🏕 ",
];

const walletDesc = (n: string): (string | null)[] => [
  `Poenostavi svojo festivalsko izkušno, tko da svoji digitalni denarnici dodaš ${n}ǝŧ žetonov. Naš brezgotovinski sistem je zasnovan, da stvari tečejo hitro, in ti omogoča, da brez cajta švigneš mimo vrst pri hrani, pijači pa merch postajah, tko da se lahk posvetiš glasbi.`,
  "Vse je povezano naravnost s tvojim računom za takojšno uporabo na kraju. Če čez vikend ne porabiš celga zneska, brez skrbi – vsak cent ostane tvoj; morebitno preostalo stanje lahk uporabiš za prihodnje nakupe vstopnic ob blagajni. Preprost pa varen način, da uživaš na dogodku brez sitnosti s fizičnim plačevanjem.",
];

const PRODUCTS: ProductDoc[] = [
  {
    uid: "festival-2026-single-ticket",
    internalName: "Festival 2026 Single ticket",
    text: {
      title: "Festival 2026 posamična vstopnica",
      special_notice: "2. spletna serija",
      checkout_description: "Posamična vstopnica za Festival 2026",
    },
    description: TICKET_DESC,
  },
  {
    uid: "festival-2026-duo-ticket",
    internalName: "Festival 2026 Duo ticket",
    text: {
      title: "Festival 2026 dvojna vstopnica",
      special_notice: "2. spletna serija",
      checkout_description: "Dvojna vstopnica za Festival 2026",
    },
    description: TICKET_DESC,
  },
  {
    uid: "festival-2026-group-ticket",
    internalName: "Festival 2026 Group ticket",
    text: {
      title: "Festival 2026 skupinska vstopnica",
      special_notice: "2. spletna serija",
      checkout_description: "Skupinska vstopnica za Festival 2026",
    },
    description: TICKET_DESC,
  },
  {
    uid: "donation-to-association",
    internalName: "Donation to Cultural association Endemit",
    text: {
      title: "Donacija Kulturnemu društvu Endemit",
      checkout_description: "Donacija za društvo 🙏",
    },
    description: [
      "Pomagaj nam, da ustvarjamo naprej. Vsak prispevek napaja prostore, zvoke pa trenutke, ki jih gradimo skupej. Izberi svoj znesek s prilagajanjem količine – vsaka enota predstavla tvojo podporo našmu delu.",
      "Brez ugodnosti, brez nagrad. Sam zavedanje, da omogočaš, kar je pomembno: umetnost, ustvarjeno s skrbjo, snidenja, oblikovana z namenom, in kolektiv, ki se premakne, ko je pravi trenutek.",
    ],
  },
  {
    uid: "wallet-top-up-20-tokens",
    internalName: "Wallet top up - 20ǝŧ",
    text: { title: "Polnjenje denarnice – 20ǝŧ", checkout_description: "Polnjenje virtualne valute za 20ǝŧ žetonov" },
    description: walletDesc("20"),
    walletFaq: true,
  },
  {
    uid: "wallet-top-up-50-tokens",
    internalName: "Wallet top up - 50ǝŧ",
    text: { title: "Polnjenje denarnice – 50ǝŧ", checkout_description: "Polnjenje virtualne valute za 50ǝŧ žetonov" },
    description: walletDesc("50"),
    walletFaq: true,
  },
  {
    uid: "wallet-top-up-100-tokens",
    internalName: "Wallet top up - 100ǝŧ",
    text: { title: "Polnjenje denarnice – 100ǝŧ", checkout_description: "Polnjenje virtualne valute za 100ǝŧ žetonov" },
    description: walletDesc("100"),
    walletFaq: true,
  },
  {
    uid: "wallet-top-up-200-tokens",
    internalName: "Wallet top up - 200ǝŧ",
    text: { title: "Polnjenje denarnice – 200ǝŧ", checkout_description: "Polnjenje virtualne valute za 200ǝŧ žetonov" },
    description: walletDesc("200"),
    walletFaq: true,
  },
  {
    uid: "issun-boshi-vinyl-ep",
    internalName: "Issun-bōshi vinyl EP",
    // title kept universal (album proper name)
    text: { checkout_description: "Issun-bōshi vinyl EP album" },
    description: [
      "MMali, ki se je uveljavil ko eden najbolj ustvarjalnih pa vsestranskih slovenskih underground DJ-jev, zdej svoji biografiji dodaja še producentske veščine. Ker že več ko 10 let didžeja pa promovira zabave v Sloveniji, si je zgradil ugled oblikovalca lokalne scene z edinstvenim zvokom pa vizijo.\n\nEP se razvija potrpežlivo, počasi gradi skoz MMalijevo lubezen do melodičnih pa perkusivno bogatih žanrov, navdihnjenih z izbori, ki jih dela ko Issun-Boshi, njegov ambientalni alter ego. Vrhunec pride z močnim, dub gnanim Inland remixom, preden se zaključi na valu čustev. Te skladbe ujamejo bistvo zgodnjih jutranjih koncev, trenutkov, ki jih je naredil za svoj podpis pri zaklučevanju dogodkov.\n\n20. september je zgodovinski datum za Mateja pa njegovo Endemit ekipo – uradna izdaja njegovga prvga vinila na njihovi domači založbi, poimenovani po njegovem alter egu Issun-Boshi, enopalčnem samuraju, ki premaga vse ovire, da osvoji srce princese, sprejme svoje pomanjklivosti pa jih preraste. Na tej poti ga spremla brat po srcu pa mojster Ed Davenport, znan tut ko Inland.",
      null, // ""
      "Iščeš digitalno kopijo? \nDobi svojo na BandCampu.\n",
      null, // "Tracklist" heading — universal
      null, // track — universal
      null,
      null,
      null,
      null, // ""
      "Zasluge",
      "Izšlo: 20. oktober 2025\n\nNapisal in produciral Matej Mirnik.\nOblikovanje Tija Dolenc Šuštar in Nejc Dornik.\nMiks in mastering Ed Davenport.",
    ],
  },
  {
    uid: "darkest-and-oddest-shades-lp",
    internalName: "Darkest And Oddest Shades LP",
    // title + checkout_description are the album name → universal
    description: [
      "Globok potop v temne kotičke elektronske glasbe – Rhaegalov Darkest And Oddest Shades prinaša surovo, brezkompromisno zbirko skladb, ki zabrišejo meje med dark ambientom, industrialom pa eksperimentalnim technom. Fizičnih kopij je zmanjkalo; na volo je digitalno.",
      null, // ""
      "Iščeš digitalno kopijo? \nDobi svojo na BandCampu.\n",
      null, // "Tracklist"
      null, null, null, null, null, null, null, null, null, null, null, // 11 track list-items
      null, // ""
      "Zasluge",
      "Izšlo: 6. februar 2026\n\nNapisal in produciral Rhaegal.\nOblikovanje Tija.ds\nMiks in mastering Omnia Vox.",
    ],
  },
  {
    uid: "hotc-official-t-shirt-black",
    internalName: "HOTC official T-Shirt (black)",
    text: {
      title: "Uradna HOTC majica (črna)",
      special_notice: "Zadnje zaloge",
      checkout_description: "Bombažna majica s HOTC tiskom",
    },
    description: [
      'Uradna majica založbe Hands of the Creator. Črn težki bombaž z ikoničnim HOTC znakom na sredini prsi in celotnim napisom »HANDS OF THE CREATOR« čez zgornji del hrbta. Osnovni kos za vsakga, ki je poravnan z brezkompromisno vizijo založbe – zasnovan, da je tok neposreden pa trajen ko glasba, ki jo predstavla. Brez polnil, brez bleferstva. Sam znak.',
    ],
  },
  {
    uid: "endemit-limited-tote-violet",
    internalName: "Endemit Limited Tote – Violet",
    text: { title: "Endemit Limited torba – vijolična", checkout_description: "Endemit Limited torba – vijolična" },
    description: [
      "Nepogrešljivi spremljevalec underground kulture. Ta vrhunska bež bombažna torba nosi ikonično Endemit umetnost, dovol trpežna za skladiščne rave pa dovol elegantna za mestne noči.",
      'Prostorna zasnova zlahka sprejme 15-palčni laptop, tvoje osnovne stvari pa karkoli že noč zahteva. Trpežna bombažna izdelava prenese intenzivnost plesišča pa ohranja obliko skoz vsakdanjo uporabo.',
      "Omejena izdaja 2025 – ko jih zmanjka, jih ni več.",
      null,
      "Podrobnosti:",
      "100 % težki bombažni canvas",
      "Ojačani ročaji pa obremenjene točke",
      'Notranjost sprejme laptope do 15"',
      "Svetlo opran vijoličen bombaž ",
      "Omejena izdaja 2025",
      null,
      "Popolna za nošenje tvojga življenja med raveom pa resničnim svetom.",
    ],
  },
  {
    uid: "endemit-core-tote-black",
    internalName: "Endemit Core Tote – Black",
    text: { title: "Endemit Core torba – črna", checkout_description: "Endemit Core torba – črna" },
    description: [
      "Nepogrešljivi spremljevalec underground kulture. Trdna je, funkcionalna, zgrajena, da nosi težo. Ta vrhunska črna bombažna torba nosi ikonični Endemit umetniški tisk, dovol trpežna za skladiščne rave pa dovol elegantna za mestne noči.",
      'Prostorna zasnova zlahka sprejme 15-palčni laptop, tvoje osnovne stvari pa karkoli že noč zahteva. Trpežna bombažna izdelava prenese intenzivnost plesišča pa ohranja obliko skoz vsakdanjo uporabo.',
      "Omejena izdaja 2025 – ko jih zmanjka, jih ni več.",
      null,
      "Podrobnosti:",
      "100 % težki bombažni canvas",
      "Ojačani ročaji pa obremenjene točke",
      'Notranjost sprejme laptope do 15"',
      "Sitotiskana Endemit umetnost",
      "Omejena izdaja 2025",
      null,
      "Popolna za nošenje tvojga življenja med raveom pa resničnim svetom.",
    ],
  },
  {
    uid: "endemit-graphic-print-t-shirt-black",
    internalName: "Endemit Graphic print T-Shirt (black)",
    text: {
      title: "Endemit majica z grafičnim tiskom (črna)",
      special_notice: "Zaloge hitro pohajajo",
      checkout_description: "Bombažna majica z Endemit tiskom",
    },
    description: [
      "Endemit umetniška majica spremeni osnovni kos garderobe v nosljiv izraz. Ta črn bombažni kos nosi očarljiv abstrakten tisk, razprostrt čez hrbet – osupljiva vizualna kompozicija, ki združi organske oblike z geometrijsko natančnostjo in ustvari izjavo, ki pritegne pozornost, ne da bi rekla besedo.",
      "Spredaj ostaja dizajn minimalen, z Endemit logotipom nevsiljivo nameščenim, kar ohranja čist estetiko, po kateri je blagovna znamka poznana. Tisk sam je ko pogled v drugo dimenzijo, s tekočimi linijami pa teksturiranimi vzorci, ki prikličejo hkrati naravne pokrajine pa digitalne glitche, in popolnoma ujamejo presečišče, kjer se underground kultura sreča z umetniško inovacijo.",
      "Ta majica uspeva v prostorih med temo pa svetlobo, kar jo naredi idealno za tiste pozne nočne seanse, kjer glasba udari drugač pa množica postane eno. Bombažna izdelava poskrbi, da ostaneš udoben, ko se stvari segrejejo, medtem ko ti krepki tisk na hrbtu da tisto prisotnost, ki ne rabi predstavitve. Za tiste, ki razumejo, da je to, kar nosiš na dogodek, del izkušnje – vizualni podaljšek energije, ki jo prineseš v vsak trenutek, naj boš izgublen v basu ali pa kramlaš s svojo ekipo v jutranjem siju.",
    ],
  },
  {
    uid: "endemit-embroidered-t-shirt-black",
    internalName: "Endemit Embroidered T-Shirt (black)",
    text: {
      title: "Endemit vezena majica (črna)",
      special_notice: "Zaloge hitro pohajajo",
      checkout_description: "Bombažna majica z Endemit tiskom",
    },
    description: [
      "Endemit signature majica na novo definira sproščeno udobje z vrhunsko izdelavo pa značilno estetiko. Izdelana iz visokokakovostnga bombaža, ta črni osnovni kos nosi uradni Endemit logotip, skrbno izvezen na prsih, kar ustvari nevsiljiv, a prefinjen kos, ki izstopa skoz pozornost do detajlov.",
      "Sproščen, rahlo ohlapen kroj ponuja sodoben silhuet, ki se gible s tabo, medtem ko podaljšani rokavi dodajo brezskrbno kul dimenzijo dizajnu. Vrhunska kakovost tkanine zagotavla trpežnost pa zračnost, kar jo naredi tok praktično ko stilsko.",
      "Naj krmariš skoz utripajočo energijo skladiščnga ravea ali pa ostajaš umirjen med sproščenim druženjem, ta majica se brez težav prilagodi tvojmu vibu. Minimalistično črno platno služi ko popolna podlaga za vezeno znamko in ustvari vsestranski kos, ki se gladko prelije iz nočnga življenja v dnevno nošnjo. Več ko sam majica – izjava stila, ki časti Endemit estetiko, hkrati pa te ohranja udobnga skoz karkoli dan ali noč prinese.",
    ],
  },
];

async function migrateProduct(client: ReturnType<typeof createClient>, p: ProductDoc) {
  const doc = await client.getByUID("product" as never, p.uid);
  const data = (doc as { data: Record<string, unknown> }).data;

  for (const [f, v] of Object.entries(p.text ?? {})) data[`${f}_sl`] = v;

  if (p.description) {
    const source = (data.description as { type: string; text: string }[]) ?? [];
    if (p.description.length !== source.length)
      console.warn(`  ⚠ ${p.uid}: ${p.description.length} description translations vs ${source.length} blocks`);
    data.description_sl = source.map((b, i) =>
      p.description![i] != null ? { type: b.type, text: p.description![i], spans: [] } : b
    );
  }

  if (p.walletFaq) {
    const slices = (data.slices as Record<string, unknown>[]) ?? [];
    const acc = slices.find(s => s.slice_type === "accordion");
    if (!acc) throw new Error(`${p.uid}: no accordion slice`);
    const items = (acc.items as Record<string, unknown>[]) ?? [];
    FAQ.forEach((faq, i) => {
      if (!items[i]) return;
      items[i].title_sl = formatSliceField("accordion", "items", "title", faq.title);
      items[i].content_sl = formatSliceField("accordion", "items", "content", faq.content);
    });
  }

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, p.internalName);
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ ${p.uid}`);
}

async function main() {
  const client = createClient();
  console.log("Products:");
  for (const p of PRODUCTS) await migrateProduct(client, p);
  console.log(`\nProducts done (${PRODUCTS.length}).`);
}

main().catch(err => {
  console.error("Products migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
