import "dotenv/config";
import * as prismic from "@prismicio/client";
import { createClient } from "./prismic-lib";

/**
 * Localizes podcast episode descriptions (Koroščina) into the planned version.
 *
 * Only `episode_description` is translated. `episode_name` ("Emit NNN - Artist"),
 * `footnote`, and the `tracklist` group are universal; meta fields are empty.
 *
 * Descriptions are all paragraphs. We walk the source blocks and replace each
 * NON-EMPTY paragraph with the next translation in order (empty spacer blocks are
 * kept verbatim), so index gaps don't matter. Embedded Slovenian episode-title
 * quotes are kept (English gloss dropped for the Slovenian audience).
 *
 * `internalName` = the doc's current `episode_name` so the editor name is kept.
 *
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-podcasts.ts
 */

type PodcastDoc = { uid: string; internalName: string; paragraphs: string[] };

const PODCASTS: PodcastDoc[] = [
  {
    uid: "emit-011-synatic-idium",
    internalName: "Emit 011 - SYNATIC IDIUM",
    paragraphs: [
      "Enajsta epizoda serije emit podcast predstavla Synatic Idium, globok, hipnotičen projekt Sandija Djulkića, ki oddaja iz Londona. Zvok oblikuje že od poznih devetdesetih in dela v potrpežlivem, hipnotičnem deep technu — tistem, ki te potegne pod gladino, namest da bi te suval naokrog.",
      "Miks si vzame cajt. Odpre se s težo pa teksturo, potem pa se umiri v dolge, razpirajoče se zanke, kjer vsaka skladba dobi prostor za dihat, preden pride naslednja. Giblje se skoz globoko, atmosfersko ozemlje brez hitenja, zaklučni del pa popusti v nekej lažjega. Dobro poslušanje za te dolge junijske večere. Ker je Endemit 26 oddaljen dva mesca, je to solidna pokušina zvoka, ki ga gradimo proti avgustu.",
    ],
  },
  {
    uid: "emit-012-seiichiro-itoyama",
    internalName: "Emit 012 - Seiichiro Itoyama",
    paragraphs: [
      "Dvanajsta epizoda serije emit podcast predstavla Seiichira Itoyamo, japonskga umetnika s sedežem v Evropi, ki dela na robu sodobnga techna.",
      "Miks se gradi skoz napetost pa zadržanost, giblje se med teksturnimi prehodi, broken-beat ovinki pa deli melodične ambientalnosti. Črpa iz berlinske reducirane linije poznih 2000-ih pa iz težje birminghamske tradicije, ampak se nikol ne ustali v nobeni — zadržanost zmerm znova preide v težo pa nazaj. Energija ostaja navita, ne eksplozivna, in daje prednost globini pred kakšnim očitnim peak-time vrhuncem, kar poskrbi, da trenutki, ki res udarijo, pravilno pristanejo.",
      "Dolg je, pa se poda k temu, kje smo zdej — globoko v julijski vročini, tisti noči, ko vročina ne popusti pa se nikomur ne mudi spat. To je set za tisti del noči: potrpežliv, fizičen, zgrajen, da drži pozornost na dolgi rok, namest da lovi takojšen high.",
    ],
  },
  {
    uid: "emit-008-beko",
    internalName: "Emit 008 - Beko",
    paragraphs: [
      "Osma epizoda serije emit podcast ujame Beka iz kolektiva ROAD!, posneto v živo ko otvoritveni set na dogodku ROAD! x Endemit v zagrebškem klubu Depo 11. oktobra 2025. Beko, poznan po mešanju hipnotičnih groovov s surovimi teksturami pa izbrušenim progresivnim pridihom, svoje all-vinyl nastope sestavla s potrpežljivostjo pa čistim fokusom.",
      "Ta otvoritveni set pokaže njegovo sposobnost, da posluščalce vodi skoz razvijajoča se stanja uma, hkrati pa ohranja natančen zagon. Beko izhaja iz atmosferskih temeljev pa postopoma uvaja hipnotične ritme pa teksturirane plasti ter gradi proti bolj vztrajnim techno ozemljem. Napredovanje razkazuje njegov mojstrski pristop k vinyl mešanju — vsak prehod izveden s tisto tehnično natančnostjo, ki postavi temelj za noč, ki sledi. ",
      "Ta posnetek ujame bistveno otvoritveno uro, kjer zadržanost pa energija najdeta svoje ravnovesje in začrtata pot za to, kar je postalo divja noč glasbe v Zagrebu.",
    ],
  },
  {
    uid: "emit-010-mmali",
    internalName: "Emit 010 - MMali",
    paragraphs: [
      "Deseta epizoda serije emit podcast predstavla MMalija, gonilno silo endemit ekipe, posneto na zaklučnem setu Ende Mit 25, naše novoletne zabave. Ura je 5h zjutrej, 1. januar 2026 — tista mejna ura, ko noč končno popusti pa se začne oblikovat novo leto.",
      "Ta posnetek ujame trenutek, ki ga je ekipa čakala: vrnitev pravih zaklučnih setov v Kadru. MMali stopi za pult, da vse popele skoz zoro s trdim, poetičnim technom, ki mu uspe bit hkrati neizprosen pa vzpodbujajoč. Nekej je na zaklučnih setih, kar zahteva drugačno energijo — soba si je zaslužila svojo izčrpanost, pa jo mora glasba počastit, hkrati pa še vedno rinit naprej. MMali dostavi točno to, uravnoteži surovo moč z dovol topline, da ludi pošle v 2026 z občutkom, da je pred nami nekej dobrga. To je techno, ki udari trdo, ampak te pusti nasmejanga, tak sendoff, ki si ga taka noč zasluži.",
    ],
  },
  {
    uid: "emit-007-vinter",
    internalName: "Emit 007 - Vinter",
    paragraphs: [
      "Sedma epizoda serije emit podcast predstavla Vinterja, DJ-ja, čigar pristop uteleša filozofijo zadržanosti ko zgolj iluzije. Njegovi izbori obstajajo v prostoru med nadzorom pa predajo, nikol se popolnoma ne zavežejo nobenmu, in ustvarjajo nenehno stanje napetosti, ki definira njegovo zvočno identiteto.",
      "Ta miks se razvija skoz skrbno umerjen pritisk, odpre se z atmosfersko globino, preden postopoma zategne svoj prijem. Vinter krmari med hipnotično ponovitvijo pa nenadnimi premiki v intenzivnosti, pušča skladbam, da zadihajo pa se razvijejo, preden uvede nove elemente, ki zmotijo pa na novo umerijo. ",
      "Ponavljajoče se vrnitve k določenim umetnikom skoz set ustvarjajo sidrišča na potovanju, medtem ko napredovanje gradi od introspektivnih tekstur proti čedalje bolj surovi, neizprosni energiji. Zaklučni del potisne v temneja, bolj razdroblena ozemlja in uteleša Vinterjevo vlogo arhitekta pričakovanja — nekoga, ki razume, da moč ne leži v sami sprostitvi, ampak v trenutkih pred njenim prihodom.",
    ],
  },
  {
    uid: "emit-005-variable",
    internalName: "Emit 005 - Variable",
    paragraphs: [
      "V tem osredotočenem enournem izletu Variable pokaže točno, zakaj je vzhajajoča sila slovenskga undergrounda. Zvest svojmu slovesu premoščanja cerebralnih zvočnih pokrajin s surovo fizično močjo, se miks odpre z zapletenimi, melanholičnimi teksturami Artefakta pa Rhythmic Theory in postavi razpoloženje globoke introspekcije.",
      "Ko set napreduje, Variable spretno prestavi, in posluščalca vodi od hipnotičnih zank Efdemina pa Samulija Kemppija v temneja, bolj industrialna ozemlja. Izbor je dialog med moderno hipnozo pa klasičnim zagonom, z težkokategorniki ko so Planetary Assault Systems pa Function ob boku izrazitih, razmajanih ritmov Palemana pa Anthonyja Linella.",
      "V središču potovanja je Variablov lasten zvočni podpis, razkazan skoz posebno neizdano produkcijo, ki zasidra srednji del seta. Prepleten z ekskluzivnimi kosi Connorja Walla pa Obscurja, je ta miks dokaz Variablove sposobnosti, da zgradi pripoved, ki je tok miselno stimulativna, kok stresa plesišče.",
    ],
  },
  {
    uid: "emit-006-ed-davenport",
    internalName: "Emit 006 - Ed Davenport",
    paragraphs: [
      "Libeliče, avgust 2024. Ura je pet zjutrej. Nad reko Dravo se prebuja zora, prva svetloba prebada jutranjo meglo pa goste plasti dima, medtem ko častimo desetletje snidenj na naši sveti zemlji. Ed Davenport bo zaklučil prvi dan festivala Endemit X, trenutek, kraj pa umetnik se popolnoma poravnajo za zaklučno dejanje noči. Zvok preseže, glasba se materializira na plesišču.",
      "Poleti 2024 je britanski producent pa DJ prinesel svoj značilen, dodelan, raziskovalen zvok v naše globoke koroške gozdove. Od njegovga temeljnga dela na Ostgut Ton pa njihovem A-TON imprintu do izdaj na Figure, Infrastructure pa lastni založbi Counterchange in Globuli, Edov opus priča o njegovem talentu, odločnosti pa natančnosti. Ampak njegov Endemit X set govori o nečem popolnoma drugem: o prijateljstvu pa rasti, o singularnosti, ki jo lahk ustvari popoln sončni vzhod v neprimerljivem okolju, ko si obdan z družino.",
      "Brez tracklista. Brez prekinitev. Sam posnetek tega, kar se je odvilo znotraj tistga neskončnga vesolja 5 ur.",
    ],
  },
  {
    uid: "emit-009-pulso",
    internalName: "Emit 009 - Pulso",
    paragraphs: [
      "Deveta epizoda serije emit podcast predstavla Pulsa, posneto v živo v Viharnikih novembra 2025, kjer je argentinski umetnik headlinal večer. Pulso je opravil pot iz Buenos Airesa, da je prinesel svoj eksperimentalen, hipnotičen zvok na ljublansko plesišče in dostavil tisti loopast, sci-fi navdihnjen set, ki je postal njegov podpis.",
      "Ta posnetek ujame, kar naredi njegov pristop poseben — analogne teksture pa nekonvencionalno oblikovanje zvoka, ki sedijo tik izven običajnga techno okvira. Njegove produkcije so našle dom na spoštovanih založbah ko sta SRIE pa Semantica, in ta ista pozornost do detajlov pride skoz v tem, kako gradi pa sprošča napetost skoz set. Miks se giblje med cerebralnimi trenutki pa čisto plesiščno energijo, nikol se ne ustali v predvidlive vzorce. To je tak nastop, ki te spomni, zakaj je pomembno pripelat umetnike iz različnih scen — Pulsov pogled je oblikoval noč, ki se je zdela res drugačna od običajne ponudbe.",
    ],
  },
  {
    uid: "emit-004-unknown-texture",
    internalName: "Emit 004 - Unknown Texture",
    paragraphs: [
      "Slovenska techno scena se še naprej razvija, in Unknown Texture predstavla njen naslednji val. Znan obraz na EMIT dogodkih, zdej zavzame svoje mesto za pultom s setom, zakoreninjenim v analogni pa modularni sintezi — hipnotični ritmi, sub-bas frekvence pa abstraktne zvočne teksture, ki te z vsakim prehodom potegnejo globje.",
      "Njegov pristop k temu miksu: »Včasih najdeš tam, ko si neho iskat«. To je filozofija, ki odmeva skoz izbor — potrpežliv, raziskovalen pa brezkompromisen. Od nebeškga otvoritvenga kosa 18 Figures do zaklučne intenzivnosti Anthonyja Linella, to je techno, ki zahteva pozornost pa jo nagradi.",
    ],
  },
  {
    uid: "emit-002-obscur",
    internalName: "Emit 002 - Obscur",
    paragraphs: [
      "»Edino vojno maš s sabo, pa še tam zgublaš« je druga epizoda serije emit podcast, ki jo je zbral 0bscur, vzhajajoč slovenski DJ pa producent. Ta miks se poglobi v surovo, gnano plat techna in objame neizprosno energijo, ki zrcali notranje boje, nakazane v naslovu.",
      "Epizoda začrta intenzivno pot skoz industrialno obarvane ritme pa plemenske perkusivne elemente, gradi napetost skoz plasti popačenih tekstur pa brezkompromisno težo basa. 0bscur prepleta uveljavlene underground glasove z vzhajajočimi producenti, vključno z več neizdanimi skladbami, ki miks začinijo s svežimi pogledi. Izbor se giblje od hipnotičnih, na zankah temelječih konstrukcij v bolj agresivna, peak-time ozemlja, in skoz cel ohranja povezano nit temne, introspektivne energije. Ta drugi del razkazuje emitovo zavezanost k platformi za lokalni talent, medtem ko razisuje zmožnost techna za fizično katarzo pa psihološko soočenje.",
    ],
  },
  {
    uid: "emit-001-rhaegal",
    internalName: "Emit 001 - Rhaegal",
    paragraphs: [
      "»Možgan V Remento« zaznamuje uvodno epizodo rhaegalove serije emit podcast in predstavla skrbno izdelano potovanje skoz globlja ozemlja sodobnga techna. Miks razisuje senčna presečišča hipnotične, surove pa atmosferske elektronske glasbe, črpa iz dub navdihnjenga berlinskga minimalizma pa iz vodnih tekstur italijanskga deep techna.",
      "Epizoda gradi svojo pripoved skoz kontraste, giblje se med meditativnimi prehodi pa visceralno peak-time intenzivnostjo. Pet neizdanih produkcij služi ko konceptualna sidra skoz cel in vodi napredovanje od introspektivnih otvoritvenih trenutkov skoz goste industrialne pokrajine, preden prispe do kontemplativne razrešitve. Ta prvi del vzpostavi emitovo pot ko platformo, ki časti cerebralne temelje underground techna, hkrati pa rine proti eksperimentalnmu oblikovanju zvoka in od svojih posluščalcev zahteva tok fizično kok miselno angažiranost.",
    ],
  },
  {
    uid: "emit-003-amanda-mussi",
    internalName: "Emit 003 - Amanda Mussi",
    paragraphs: [
      "Tretja epizoda serije emit podcast predstavla Amando Mussi, brazilsko-paragvajsko DJ-ko, producentko pa vodjo založbe in agencije, poznano po svoji dinamični prisotnosti v techno pa house sceni. Ta posnetek ujame njen nastop v živo na Cvetkah v jeseni, uradnem endemit dogodku v Kadru Kodeljevo 29. novembra 2024.",
      "Amandin set pokaže njeno sposobnost, da obvladuje plesišče z energično mešanico gnanih ritmov pa skrbno zgrajene napetosti. Posnetek v živo ohranja surovo neposrednost noči in dokumentira njen intuitiven izbor skladb pa mojstrstvo mešanja, ko se je odzivala na energijo sobe. Ta epizoda zaznamuje premik v emitovem formatu, od studijskih miksov k dokumentaciji v živo, in ujame visceralno povezavo med umetnikom pa občinstvom, ki v svojem najlepšem definira underground techno kulturo.",
    ],
  },
];

async function migratePodcast(client: ReturnType<typeof createClient>, p: PodcastDoc) {
  const doc = await client.getByUID("podcast" as never, p.uid);
  const data = (doc as { data: Record<string, unknown> }).data;
  const source = (data.episode_description as { type: string; text: string }[]) ?? [];

  let ti = 0;
  data.episode_description_sl = source.map(b => {
    if (b.text && b.text.trim()) {
      const t = p.paragraphs[ti++];
      return { type: b.type, text: t ?? b.text, spans: [] };
    }
    return b; // empty spacer — keep verbatim
  });
  if (ti !== p.paragraphs.length)
    console.warn(`  ⚠ ${p.uid}: used ${ti}/${p.paragraphs.length} translations`);

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, p.internalName);
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ ${p.uid}`);
}

async function main() {
  const client = createClient();
  console.log("Podcasts:");
  for (const p of PODCASTS) await migratePodcast(client, p);
  console.log(`\nPodcasts done (${PODCASTS.length}).`);
}

main().catch(err => {
  console.error("Podcasts migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
