import "dotenv/config";
import * as prismic from "@prismicio/client";
import { createClient } from "./prismic-lib";

/**
 * Structure-preserving localization of the legal/policy content pages. Reads the
 * source rich-text blocks and rewrites each block's text with a Slovenian
 * translation while keeping the block TYPE (heading/list-item/paragraph), so
 * formatting is preserved. Standard formal Slovenian (not the Koroščina voice)
 * — appropriate for legal text. Drafts land in the planned version; base English
 * is untouched. DRAFTS — must be legally reviewed before publishing.
 *
 * Each translations array is index-aligned with the source content blocks.
 * `null` = keep the source block text unchanged (empty spacers, addresses).
 */
type Blocks = (string | null)[];

async function migrateLegal(
  uid: string,
  internalName: string,
  titleSl: string,
  blocksSl: Blocks
) {
  const client = createClient();
  const doc = await client.getByUID("content_page", uid);
  const data = doc.data as Record<string, unknown>;
  data.title_sl = titleSl;

  const slices = (data.slices as Record<string, unknown>[]) ?? [];
  const cs = slices.find(s => s.slice_type === "content_section");
  if (!cs) throw new Error(`${uid}: no content_section`);
  const primary = cs.primary as Record<string, unknown>;
  const source = (primary.content as { type: string; text: string }[]) ?? [];

  if (blocksSl.length !== source.length) {
    console.warn(
      `  ⚠ ${uid}: ${blocksSl.length} translations vs ${source.length} source blocks — extra blocks keep English`
    );
  }

  primary.content_sl = source.map((b, i) => ({
    type: b.type,
    text: blocksSl[i] != null ? blocksSl[i] : b.text,
    spans: [],
  }));

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, internalName);
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ ${uid} (${source.length} blocks)`);
}

// --- Notice on Purchase of Digital Products ------------------------------
const NOTICE: Blocks = [
  "Datum začetka veljavnosti: 1. oktober 2025",
  null,
  "Pomembne informacije za potrošnike",
  "To obvestilo velja za nakupe digitalne vsebine pri:",
  null,
  null,
  null,
  "1. Kaj so digitalni izdelki?",
  "Digitalni izdelki, ki so na voljo na naši platformi, vključujejo:",
  "vstopnice za dogodke (dostavljene elektronsko)",
  "digitalne prenose (glasbeni albumi, zvočne datoteke, digitalna vsebina)",
  "drugo nefizično digitalno vsebino",
  null,
  "2. Takojšnja dostava",
  "Vsi digitalni izdelki so dostavljeni takoj po uspešnem plačilu. Digitalni izdelek prejmeš po e-pošti na naslov, ki ga navedeš ob nakupu.",
  null,
  "3. Ni pravice do odstopa",
  "POMEMBNO: Z nakupom digitalnih izdelkov izrecno potrjuješ in se strinjaš, da:",
  "bo digitalna vsebina dostavljena takoj po zaključku tvojega nakupa;",
  "izrecno soglašaš s to takojšnjo dostavo;",
  "se odpoveduješ pravici do odstopa, ki bi sicer veljala za potrošniške nakupe po Direktivi EU o pravicah potrošnikov;",
  "so digitalni izdelki po dostavi nepovratni.",
  "Ta odpoved je v skladu s členom 16(m) Direktive EU o pravicah potrošnikov, ki izključuje digitalno vsebino, dostavljeno takoj s predhodnim izrecnim soglasjem potrošnika in potrditvijo izgube pravice do odstopa.",
  null,
  "4. Kaj to pomeni zate",
  "Vstopnice za dogodke",
  "Nepovratne: kupljenih vstopnic za dogodke ni mogoče vrniti ali zamenjati.",
  "Neprenosljive: vstopnice praviloma niso prenosljive, razen če je navedeno drugače.",
  "Spremembe dogodka: če dogodek odpovemo ali bistveno prestavimo, ti bomo ponudili dostop do prestavljenega dogodka ali nadomestno ureditev.",
  "Digitalni prenosi",
  "Brez vračil: prenesene digitalne vsebine (albumov, datotek) po dostavi na tvoj e-naslov ni mogoče vrniti.",
  "Odgovornost za dostavo: sam si odgovoren, da je tvoj e-naslov pravilen.",
  "Dostop: navodila za prenos ali povezave do dostopa prejmeš po e-pošti.",
  "5. Tvoja potrditev",
  "S klikom na »Kupi« ali »Zaključi naročilo« za digitalne izdelke potrjuješ, da:",
  "✓ razumeš, da je izdelek digitalen in bo dostavljen takoj;\n✓ izrecno zahtevaš takojšnjo dostavo;\n✓ potrjuješ, da se odpoveduješ 14-dnevni pravici do odstopa;\n✓ sprejemaš, da je nakup nepovraten.",
  "6. Kakovost in tehnične težave",
  "Čeprav se odpoveduješ pravici do odstopa, obdržiš vse druge potrošniške pravice, vključno s/z:",
  "pravico do skladnosti: digitalna vsebina mora biti taka, kot je opisana, in primerna za namen;",
  "pravico do odprave napak: če je digitalna vsebina pomanjkljiva ali ni takšna, kot je opisana, si morda upravičen do odprave napake;",
  "tehnično podporo: obrni se na nas, če imaš tehnične težave z dostavo ali dostopom.",
  "7. Odpovedi dogodkov",
  "Če Endemit dogodek odpove ali bistveno prestavi:",
  "imetnike vstopnic obvestimo po e-pošti;",
  "vstopnice ostanejo veljavne za nov datum dogodka;",
  "če prestavitev ni mogoča, sporočimo nadomestno ureditev.",
  "8. Kontakt za težave",
  "Če imaš težave s/z:",
  "nedostavo digitalnih izdelkov;",
  "tehničnimi težavami pri dostopu do vsebine;",
  "pomanjkljivo ali neskladno digitalno vsebino;",
  "nas nemudoma kontaktiraj:",
  "E-pošta: endemit@endemit.org\nNaslov: Kulturno društvo Endemit, Javornik 65, 2390 Ravne na Koroškem, Slovenija",
  "Prizadevali si bomo, da pristne tehnične težave ali težave z dostavo hitro rešimo.",
  "9. Potrošniške pravice",
  "To obvestilo ne vpliva na tvoje zakonske pravice po predpisih o varstvu potrošnikov. Za nasvete glede potrošniških pravic in reševanje sporov se lahko obrneš na:",
  "Tržni inšpektorat Republike Slovenije\nSpletna stran: https://www.gov.si/drzavni-organi/organi-v-sestavi/trzni-inspektorat/",
  "Platforma EU za spletno reševanje sporov\nSpletna stran: https://ec.europa.eu/consumers/odr",
  "10. Fizični izdelki",
  "To obvestilo velja SAMO za digitalne izdelke. Za fizično blago in izdelke velja standardna 14-dnevna pravica do odstopa. Podrobnosti o vračilu fizičnih izdelkov najdeš v ločenem dokumentu »Pravica do odstopa«.",
  "Zadnja posodobitev: 15. oktober 2025",
  "To obvestilo pred nakupom digitalnih izdelkov skrbno preberi. Če imaš vprašanja, nas kontaktiraj pred zaključkom nakupa.",
];

// --- Code of Conduct (96 blocks) -----------------------------------------
const CODE_OF_CONDUCT: Blocks = [
  "Naša zaveza",
  "Endemit se zavezuje k zagotavljanju varnega, vključujočega in spoštljivega okolja, kjer lahko vsi uživajo v glasbi in skupnosti. Ta kodeks ravnanja velja za vse obiskovalce, umetnike, osebje, prostovoljce in vse prisotne na naših dogodkih.",
  null,
  "Pričakovano vedenje",
  "Spoštovanje in prijaznost",
  "Do vseh se vedi dostojanstveno, prijazno in spoštljivo, ne glede na raso, etnično pripadnost, spolno identiteto, spolno usmerjenost, starost, sposobnosti, videz ali ozadje.",
  "Vedno spoštuj osebne meje in prostor.",
  "Pred fizičnim stikom, vključno z objemanjem, dotikanjem ali fotografiranjem, prosi za izrecno privolitev.",
  "Bodi pozoren na glasnost in vsebino svojih pogovorov.",
  "Podpri soobiskovalce, ki morda potrebujejo pomoč.",
  "Varnost na prvem mestu",
  "Pazite drug na drugega – če opaziš nekoga v stiski, nemudoma obvesti varnostnike ali osebje.",
  "Ostani hidriran in si vzemi odmore, ko jih potrebuješ.",
  "Zavedaj se svoje okolice in osebnih meja.",
  "Vse pomisleke glede varnosti nemudoma sporoči osebju.",
  "Pazi na svoj sluh in po potrebi uporabi čepke za ušesa.",
  "Če nekaj opaziš, povej.",
  "Ozaveščenost o substancah",
  "Delujemo v skladu z vso veljavno zakonodajo.",
  "Na prizorišču ne deli, prodajaj ali razpečuj nobenih substanc.",
  "Če ti ali kdo drug potrebuje zdravniško pomoč, jo nemudoma poišči brez strahu – naša prioriteta sta zdravje in varnost.",
  "Zdravstvena amnestija: pri osebah, ki iščejo zdravniško pomoč zaradi zapletov, povezanih s substancami, ne bomo vključevali organov pregona.",
  null,
  "Prepovedano vedenje",
  "Naslednja ravnanja bodo imela za posledico takojšnjo odstranitev z dogodka brez vračila denarja in lahko privedejo do trajne prepovedi udeležbe na prihodnjih dogodkih:",
  "Politika ničelne tolerance",
  "spolno nadlegovanje ali napad kakršne koli vrste;",
  "fizično nasilje ali grožnje z nasiljem;",
  "sovražni govor ali diskriminatorno vedenje, usmerjeno v zaščitene osebne okoliščine;",
  "fotografiranje ali snemanje brez privolitve (vedno najprej vprašaj);",
  "namerno omamljanje ali dodajanje substanc v pijačo;",
  "kraja ali uničevanje lastnine;",
  "prodaja ali razpečevanje substanc na prizorišču.",
  "Nadlegovanje vključuje",
  "nezaželeno spolno pozornost ali približevanje;",
  "zalezovanje ali sledenje;",
  "namerno ustrahovanje;",
  "vztrajno motenje dogodka;",
  "neprimeren fizični stik brez privolitve;",
  "nezaželene pripombe o videzu, oblačilih ali telesu.",
  "Moteče vedenje",
  "pretepanje ali agresivno vedenje;",
  "prekomerna opitost, ki ogroža tebe ali druge;",
  "poseganje v zvočno, svetlobno ali drugo tehnično opremo;",
  "plezanje po konstrukcijah, zvočnikih ali opremi;",
  "neupoštevanje navodil osebja dogodka ali varnostnikov.",
  null,
  "Kultura privolitve",
  "Privolitev je obvezna. To pomeni:",
  "da vprašaš, preden se koga dotakneš, vključno s tesnim plesom;",
  "da »ne« sprejmeš takoj in brez pritiska;",
  "da razumeš, da je privolitev mogoče kadar koli preklicati;",
  "da opitost ne opravičuje vedenja brez privolitve;",
  "da se zavedaš, da privolitev v eno dejavnost ne pomeni privolitve v druge.",
  null,
  null,
  "Pravice in zaščita organizatorja",
  "Naša pooblastila",
  "Kot organizatorji dogodka si pridržujemo pravico, da:",
  "po lastni presoji zavrnemo vstop ali odstranimo posameznika;",
  "posameznikom zaradi kršitev tega kodeksa ravnanja prepovemo udeležbo na prihodnjih dogodkih;",
  "vključimo organe pregona, kadar pride do nezakonitega dejanja ali je ogrožena varnost;",
  "sprejemamo dokončne odločitve o kršitvah kodeksa ravnanja;",
  "to politiko po potrebi posodobimo.",
  "Omejitev odgovornosti",
  "obiskovalci se udeležujejo na lastno odgovornost;",
  "z udeležbo se strinjaš, da boš upošteval ta kodeks ravnanja, in sprejmeš posledice kršitev;",
  "potrjuješ, da nismo odgovorni za ravnanja drugih obiskovalcev;",
  "ta kodeks ravnanja ne ustvarja posebnega razmerja ali dolžnosti, ki ne bi že obstajali po zakonu.",
  "Prevzem tveganja",
  "Obiskovalci potrjujejo, da:",
  "dogodki elektronske glasbe vključujejo neločljiva tveganja, vključno z glasno glasbo, utripajočimi lučmi in velikimi množicami;",
  "so sami odgovorni za svojo varnost in dobro počutje;",
  "se dogodka ne bi smeli udeležiti, če imajo stanja, na katera bi ti elementi lahko vplivali;",
  "zagotavljamo varnostne in zaščitne ukrepe, a ne moremo jamčiti popolne varnosti.",
  null,
  null,
  "Odgovornost skupnosti",
  "Ustvarjanje varnega prostora je odgovornost vseh:",
  "opozori prijatelje, ki kršijo meje – pravi prijatelji ne dovolijo, da bi prijatelji koga nadlegovali;",
  "podpri preživele in priče;",
  "bodi zgled vedenja, ki si ga želiš videti;",
  "pomagaj nam graditi boljšo skupnost.",
  null,
  "Spremembe",
  "Pridržujemo si pravico, da ta kodeks ravnanja kadar koli spremenimo. Trenutna različica bo vedno na voljo na endemit.org/code-of-conduct.",
  null,
  "Potrditev",
  "Z nakupom vstopnice, vstopom na prizorišče ali udeležbo na našem dogodku se strinjaš, da boš upošteval ta kodeks ravnanja.",
  null,
  "Vprašanja ali pomisleki? Piši nam na endemit@endemit.org.",
  "Nujna pomoč? Pokliči 112 ali nemudoma obvesti najbližjega člana osebja.",
  null,
  null,
  "Ta kodeks ravnanja je prirejen po standardih skupnosti in dobrih praksah na področju varnosti dogodkov in zmanjševanja škode. Zavezani smo k nenehnemu izboljševanju svojih politik, da bomo bolje služili naši skupnosti.",
  null,
];

// --- Privacy Policy (74 blocks) ------------------------------------------
const PRIVACY: Blocks = [
  "Datum začetka veljavnosti: 1. oktober 2025 · Zadnja posodobitev: 1. oktober 2025",
  null,
  "1. Upravljavec",
  "Kulturno društvo Endemit\nJavornik 65\n2390 Ravne na Koroškem, Slovenija\n\nMatična številka: 2943166000\nDavčna številka: 64212424\nE-pošta: endemit@endemit.org",
  "Zavezani smo k varovanju tvojih osebnih podatkov v skladu s Splošno uredbo o varstvu podatkov (GDPR) in slovensko zakonodajo o varstvu podatkov.",
  null,
  "2. Podatki, ki jih zbiramo",
  "2.1 Podatki, ki jih posreduješ",
  "ime in kontaktni podatki (e-pošta, poštni naslov, telefon);",
  "podatki o plačilu (obdeluje jih Stripe);",
  "zgodovina naročil in nakupov;",
  "nastavitve naročnine na novice.",
  "2.2 Samodejno zbrani podatki",
  "analitični podatki prek Google Analytics (naslov IP, vrsta brskalnika, podatki o napravi, obiskane strani, čas zadrževanja);",
  "vzorci uporabe in nastavitve.",
  "2.3 Piškotki: na naši spletni strani ne uporabljamo piškotkov.",
  "3. Kako uporabljamo tvoje podatke",
  "Tvoje osebne podatke obdelujemo za naslednje namene:",
  "3.1 Obdelava naročil (pravna podlaga: izvajanje pogodbe)",
  "obdelava in izpolnjevanje tvojih naročil;",
  "pošiljanje potrditev in posodobitev naročil;",
  "upravljanje plačil in izdajanje računov;",
  "dostava digitalnih izdelkov in pošiljanje fizičnih izdelkov.",
  "3.2 Podpora strankam (pravna podlaga: izvajanje pogodbe)",
  "odgovarjanje na povpraševanja in prošnje za podporo;",
  "obravnava pritožb in sporov.",
  "3.3 Trženje (pravna podlaga: privolitev)",
  "pošiljanje novic in promocijskih e-sporočil (samo če se naročiš prek Email Octopus);",
  "obveščanje o dogodkih, izdelkih in storitvah.",
  "3.4 Zakonske obveznosti (pravna podlaga: skladnost z zakonodajo)",
  "vodenje evidenc za davčne in računovodske namene;",
  "izpolnjevanje zakonskih zahtev glede hrambe.",
  "3.5 Analitika (pravna podlaga: zakoniti interes)",
  "razumevanje vzorcev uporabe spletne strani;",
  "izboljševanje naše platforme in storitev.",
  "4. Deljenje podatkov",
  "Tvoje podatke delimo le v naslednjih primerih:",
  "4.1 Ponudniki storitev",
  "Stripe: obdelava plačil (transakcije s kreditnimi karticami);",
  "Email Octopus: upravljanje novic (samo če se naročiš);",
  "Google Analytics: spletna analitika;",
  "dostavne službe: dostava fizičnih izdelkov.",
  "4.2 Zakonske zahteve: tvoje podatke lahko razkrijemo, če to zahteva zakon, sodna odredba ali državni organ.",
  "4.3 Brez prodaje podatkov: tvojih osebnih podatkov ne prodajamo, oddajamo ali menjamo s tretjimi osebami.",
  "5. Mednarodni prenosi podatkov",
  "Nekateri naši ponudniki storitev (Stripe, Google Analytics, Email Octopus) lahko prenašajo podatke izven EU/EGP. Ti prenosi so zaščiteni s/z:",
  "standardnimi pogodbenimi klavzulami EU;",
  "sklepi Evropske komisije o ustreznosti;",
  "drugimi ustreznimi zaščitnimi ukrepi po GDPR.",
  "6. Hramba podatkov",
  "Podatki o nakupih: podatke o naročilih in strankah hranimo 2 leti od datuma nakupa oziroma dlje, če to zahtevajo davčne ali zakonske obveznosti (običajno do 10 let za računovodske evidence).",
  "Naročnine na novice: tvoj e-naslov hranimo, dokler se ne odjaviš.",
  "Analitični podatki: podatki Google Analytics so anonimizirani in se hranijo v skladu z našo konfiguracijo analitike (običajno 26 mesecev).",
  "7. Tvoje pravice",
  "V skladu z GDPR imaš naslednje pravice:",
  "7.1 Pravica do dostopa\nZahtevaš lahko kopijo svojih osebnih podatkov, ki jih hranimo.",
  "7.2 Pravica do popravka\nPopraviš lahko netočne ali nepopolne podatke.",
  "7.3 Pravica do izbrisa\nZahtevaš lahko izbris svojih podatkov (ob upoštevanju zakonskih zahtev glede hrambe).",
  "7.4 Pravica do omejitve\nV določenih okoliščinah lahko zahtevaš omejitev obdelave podatkov.",
  "7.5 Pravica do prenosljivosti podatkov\nSvoje podatke lahko prejmeš v strukturirani, strojno berljivi obliki.",
  "7.6 Pravica do ugovora\nUgovarjaš lahko obdelavi na podlagi zakonitih interesov ali za namene trženja.",
  "7.7 Pravica do preklica privolitve\nPrivolitev za naročnino na novice lahko kadar koli prekličeš.",
  "7.8 Pravica do pritožbe\nPritožbo lahko vložiš pri Informacijskem pooblaščencu:\nSpletna stran: https://www.ip-rs.si\nE-pošta: gp.ip@ip-rs.si",
  "8. Varnost podatkov",
  "Izvajamo ustrezne tehnične in organizacijske ukrepe za zaščito tvojih podatkov pred nepooblaščenim dostopom, izgubo ali spremembo. Vendar pa noben prenos po internetu ni popolnoma varen in ne moremo jamčiti popolne varnosti.",
  "9. Zasebnost otrok",
  "Naše storitve niso namenjene osebam, mlajšim od 18 let. Zavestno ne zbiramo podatkov mladoletnikov.",
  "10. Povezave tretjih oseb",
  "Naša spletna stran lahko vsebuje povezave do spletnih strani tretjih oseb. Za njihove prakse glede zasebnosti nismo odgovorni. Prosimo, preglej njihove politike zasebnosti.",
  "11. Spremembe te politike",
  "To politiko zasebnosti lahko občasno posodobimo. Spremembe bodo objavljene na tej strani s posodobljenim datumom začetka veljavnosti. O pomembnih spremembah te obvestimo po e-pošti.",
  "12. Kontakt",
  "Za vprašanja, pomisleke ali uveljavljanje svojih pravic:",
  "E-pošta: endemit@endemit.org\nNaslov: Kulturno društvo Endemit, Javornik 65, 2390 Ravne na Koroškem, Slovenija",
];

// --- Terms and Conditions (44 blocks) ------------------------------------
const TERMS: Blocks = [
  "Datum začetka veljavnosti: 1. oktober 2025 · Zadnja posodobitev: 1. oktober 2025",
  "1. Splošne informacije",
  "Ti splošni pogoji urejajo tvojo uporabo e-trgovinske platforme Endemit ter nakup izdelkov, vstopnic, blaga in digitalne vsebine, ki jih ponuja:",
  "Kulturno društvo Endemit\nJavornik 65\n2390 Ravne na Koroškem, Slovenija\n\nMatična številka: 2943166000\nDavčna številka: 64212424\nE-pošta: endemit@endemit.org",
  "Zavezani smo k varovanju tvojih osebnih podatkov v skladu s Splošno uredbo o varstvu podatkov (GDPR) in slovensko zakonodajo o varstvu podatkov.",
  "Z nakupom na naši platformi se strinjaš s temi splošnimi pogoji.",
  "2. Starostna zahteva",
  "Za nakupe na naši platformi moraš biti star vsaj 18 let. Z oddajo naročila potrjuješ, da izpolnjuješ to starostno zahtevo.",
  "3. Izdelki in storitve",
  "Prek naše platforme ponujamo:",
  "vstopnice za dogodke (digitalne, nepovratne);",
  "fizično blago in izdelke;",
  "digitalne prenose (glasba, vsebina);",
  "druge kulturne izdelke.",
  "4. Naročanje in plačilo",
  "4.1 Postopek naročila\nKo oddaš naročilo, poda zavezujočo ponudbo za nakup. Po e-pošti ti pošljemo potrditev naročila, ki pomeni sprejem tvoje ponudbe.",
  "4.2 Plačilo\nSprejemamo plačila s kreditnimi karticami, ki jih obdeluje Stripe. Plačilo zapade takoj ob oddaji naročila. Naročila obdelamo šele po uspešnem plačilu.",
  "4.3 Cene\nVse cene so v EUR in so končne. Ker Kulturno društvo Endemit ni zavezanec za DDV, se DDV na naše izdelke in storitve ne obračunava. Pridržujemo si pravico do popravka napak v cenah.",
  "5. Digitalni izdelki (vstopnice in prenosi)",
  "5.1 Nepovratni\nDigitalne vstopnice in prenosi so po nakupu in dostavi nepovratni. Z nakupom potrjuješ, da se odpoveduješ pravici do odstopa za digitalno vsebino, ki je dostavljena takoj.",
  "5.2 Dostava\nDigitalni izdelki so dostavljeni po e-pošti na naslov, naveden ob nakupu. Sam si odgovoren, da je tvoj e-naslov pravilen.",
  "5.3 Spremembe dogodka\nČe dogodek odpovemo ali bistveno prestavimo, ponudimo nove datume. Vstopnice ostanejo veljavne za prestavljeni dogodek.",
  "6. Fizični izdelki",
  "6.1 Pošiljanje\nFizične izdelke pošiljamo po vsem svetu. Stroški pošiljanja in dobavni roki se razlikujejo glede na cilj in so vidni v postopku nakupa.",
  "6.2 Dobavni roki\nOcenjeni dobavni roki so navedeni ob nakupu, a niso zajamčeni. Za zamude, ki jih povzročijo dostavne službe, nismo odgovorni.",
  "6.3 Prenos tveganja\nTveganje izgube ali poškodbe preide nate ob predaji izdelka dostavni službi.",
  "7. Pravica do odstopa (samo fizični izdelki)",
  "Za fizične izdelke imajo potrošniki v EU 14-dnevno pravico do odstopa. Podrobnosti so v našem ločenem dokumentu »Pravica do odstopa«.",
  "8. Odgovornost",
  "8.1 Naša odgovornost\nOdgovorni smo za škodo, ki nastane zaradi naklepne ali hudo malomarne kršitve obveznosti. Odgovornost za lahko malomarnost je omejena na predvidljivo, običajno nastalo škodo.",
  "8.2 Tvoja odgovornost\nSam si odgovoren za varovanje zaupnosti podatkov svojega računa in za vse dejavnosti pod svojim računom.",
  "9. Intelektualna lastnina",
  "Vsa vsebina na naši platformi, vključno z besedili, slikami, logotipi in digitalnimi izdelki, je zaščitena z avtorskimi pravicami in v lasti Kulturnega društva Endemit ali naših dajalcev licenc. Nepooblaščena uporaba je prepovedana.",
  "10. Varstvo podatkov",
  "Tvoji osebni podatki se obdelujejo v skladu z našo politiko zasebnosti in veljavno zakonodajo o varstvu podatkov.",
  "11. Reševanje sporov",
  "11.1 Pravo, ki se uporablja\nZa te pogoje se uporablja slovensko pravo, z izključitvijo Konvencije ZN o pogodbah o mednarodni prodaji blaga.",
  "11.2 Pristojnost\nZa spore s potrošniki velja zakonsko predpisana pristojnost. Za spore s trgovci je kraj pristojnosti Ravne na Koroškem, Slovenija.",
  "11.3 Spletno reševanje sporov\nPotrošniki v EU lahko uporabijo platformo EU za spletno reševanje sporov: https://ec.europa.eu/consumers/odr",
  "12. Spremembe pogojev",
  "Pridržujemo si pravico do spremembe teh splošnih pogojev. Spremembe sporočimo po e-pošti ali na naši spletni strani. Nadaljnja uporaba po spremembah pomeni sprejem.",
  "13. Kontakt",
  "Za vprašanja ali pomisleke glede teh splošnih pogojev:",
  "E-pošta: endemit@endemit.org\nNaslov: Kulturno društvo Endemit, Javornik 65, 2390 Ravne na Koroškem, Slovenija",
];

// --- Right to Withdrawal (66 blocks) -------------------------------------
const WITHDRAWAL: Blocks = [
  "Datum začetka veljavnosti: 15. oktober 2025",
  null,
  "1. Splošne informacije",
  "Ta dokument opisuje tvojo pravico do odstopa od nakupov pri:",
  "Kulturno društvo Endemit\nJavornik 65\n2390 Ravne na Koroškem, Slovenija",
  "\nMatična številka: 2943166000\nDavčna številka: 64212424\nE-pošta: endemit@endemit.org",
  "V skladu z Direktivo EU o pravicah potrošnikov in slovensko zakonodajo o varstvu potrošnikov imajo potrošniki posebne pravice do preklica nekaterih nakupov.",
  null,
  "2. Pravica do odstopa za fizične izdelke",
  "2.1 14-dnevni rok za odstop\nČe si potrošnik (nakup za osebno, nekomercialno uporabo), imaš pravico, da v 14 dneh brez navedbe razloga odstopiš od nakupa fizičnih izdelkov.",
  "Rok za odstop poteče 14 dni od dne, ko:",
  "ti (ali tretja oseba, ki jo določiš, razen prevoznika) prejmeš blago;",
  "pri več izdelkih, naročenih skupaj, a dostavljenih ločeno: prejmeš zadnji izdelek;",
  "pri blagu, dostavljenem v več pošiljkah ali kosih: prejmeš zadnjo pošiljko ali kos.",
  null,
  null,
  "2.2 Kako uveljaviš svojo pravico\nZa uveljavljanje pravice do odstopa nas moraš o svoji odločitvi obvestiti z jasno izjavo. Lahko:",
  "nam pišeš na: endemit@endemit.org;",
  "nam pišeš na naslov: Kulturno društvo Endemit, Javornik 65, 2390 Ravne na Koroškem, Slovenija.",
  "Tvoja izjava naj vsebuje:",
  "tvoje ime in kontaktne podatke;",
  "številko naročila in datum nakupa;",
  "opis izdelka oz. izdelkov, ki jih želiš vrniti;",
  "jasno izjavo o nameri odstopa.",
  null,
  "2.3 Rok za odstop\nZa upoštevanje roka za odstop moraš obvestilo o odstopu poslati pred iztekom 14-dnevnega roka.",
  null,
  "3. Učinki odstopa",
  "3.1 Vračila\nČe odstopiš od pogodbe, ti povrnemo vsa prejeta plačila, vključno s stroški dostave (razen dodatnih stroškov, ki nastanejo, ker si izbral drug način dostave kot standardnega, ki ga ponujamo).",
  null,
  "3.2 Rok za vračilo\nVračilo obdelamo v 14 dneh od dne, ko prejmemo tvoje obvestilo o odstopu. Vračilo lahko zadržimo, dokler ne prejmemo vrnjenega blaga ali dokazila o vračilu, kar je prej.",
  null,
  "3.3 Način vračila\nVračila izvedemo z istim načinom plačila, kot si ga uporabil pri prvotni transakciji, razen če se izrecno dogovorimo drugače. Zaradi vračila ti ne nastanejo nobeni stroški.",
  null,
  "3.4 Vračilo blaga\nBlago nam moraš vrniti brez nepotrebnega odlašanja in najkasneje v 14 dneh od dne, ko si sporočil odstop. Rok je izpolnjen, če blago pošlješ pred iztekom 14-dnevnega roka.",
  "Naslov za vračilo:\nKulturno društvo Endemit\nJavornik 65\n2390 Ravne na Koroškem, Slovenija",
  null,
  "3.5 Stroški vračila\nNeposredne stroške vračila blaga nosiš sam, razen če smo se dogovorili, da jih krijemo mi.",
  null,
  "3.6 Stanje vrnjenega blaga\nOdgovarjaš le za zmanjšano vrednost blaga, ki je posledica ravnanja, ki presega tisto, kar je potrebno za ugotovitev narave, lastnosti in delovanja blaga. Blago mora biti po možnosti vrnjeno v prvotnem stanju in embalaži.",
  null,
  null,
  "4. Izjeme – brez pravice do odstopa",
  "V skladu s pravom EU pravica do odstopa NE velja za:",
  "4.1 Digitalna vsebina (vstopnice in prenosi)\nIzrecno se odpoveduješ pravici do odstopa za digitalno vsebino (vstopnice za dogodke, digitalni prenosi albumov), ki je dostavljena takoj ob nakupu. Z zaključkom nakupa:",
  "potrjuješ, da bo digitalna vsebina dostavljena takoj;",
  "izrecno soglašaš s takojšnjo dostavo;",
  "potrjuješ, da ob dostavi izgubiš pravico do odstopa.",
  "4.2 V celoti opravljene storitve\nStoritve (vključno z dostopom do dogodkov), če se je izvedba začela s tvojim predhodnim izrecnim soglasjem in potrditvijo, da ob popolni izvedbi storitve izgubiš pravico do odstopa.",
  "4.3 Odpečateno zapečateno blago\nBlago, zapečateno iz zdravstvenih ali higienskih razlogov, ki je bilo po dostavi odpečateno.",
  "4.4 Izdelano po meri ali prilagojeno blago\nBlago, izdelano po tvojih specifikacijah ali jasno prilagojeno.",
  null,
  "5. Vzorčni obrazec za odstop",
  "Uporabiš lahko naslednjo predlogo, čeprav ni obvezna:",
  "Za: Kulturno društvo Endemit, Javornik 65, 2390 Ravne na Koroškem, Slovenija\nE-pošta: endemit@endemit.org",
  "S tem obveščam, da odstopam od svoje pogodbe za prodajo naslednjega blaga:",
  "Številka naročila: [_________]",
  "Naročeno dne: [_________]",
  "Prejeto dne: [_________]",
  "Izdelek oz. izdelki: [_________]",
  "Ime: []\nNaslov: []\nE-pošta: []\nDatum: []\nPodpis (če je obrazec v papirni obliki): [_________]",
  null,
  "6. Vprašanja",
  "Za vprašanja glede tvoje pravice do odstopa ali postopka vračila nas kontaktiraj:",
  "E-pošta: endemit@endemit.org\nNaslov: Kulturno društvo Endemit, Javornik 65, 2390 Ravne na Koroškem, Slovenija",
  "Zadnja posodobitev: 15. oktober 2025",
];

async function main() {
  console.log("Legal pages (standard Slovenian drafts):");
  await migrateLegal(
    "code-of-conduct",
    "Code of conduct",
    "Kodeks ravnanja",
    CODE_OF_CONDUCT
  );
  await migrateLegal(
    "privacy-policy",
    "Privacy policy",
    "Politika zasebnosti",
    PRIVACY
  );
  await migrateLegal(
    "terms-and-conditions",
    "Terms and conditions",
    "Splošni pogoji",
    TERMS
  );
  await migrateLegal(
    "right-to-withdrawal",
    "Right to Withdrawal",
    "Pravica do odstopa",
    WITHDRAWAL
  );
  await migrateLegal(
    "notice-on-purchase-of-digital-products",
    "Notice on Purchase of Digital Products",
    "Obvestilo o nakupu digitalnih izdelkov",
    NOTICE
  );
  console.log("\nDone. NOTE: legal drafts — review before publishing.");
}

main().catch(err => {
  console.error("Legal migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
