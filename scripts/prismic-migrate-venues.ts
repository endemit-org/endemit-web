import { migrateDoc, type DocTranslations } from "./prismic-lib";

/**
 * Localizes venue descriptions (Koroščina). Venue names are proper nouns → kept
 * universal (no name_sl). Drafts land in the planned version.
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-venues.ts
 */
const VENUES: Record<string, DocTranslations> = {
  "big-nose": {
    type: "venue",
    internalName: "Big Nose Shop",
    base: {
      description:
        "V samem srcu Ljubljane na Tavčarjevi ulici 11 je Big Nose veliko več ko običajen trgovski prostor; je utripajoče srce mestne underground kulture in zatočišče za ustvarjalno nagnjene. Ta živahna concept trgovina premošča vrzel med vrhunskim butikom in dnevno sobo skupnosti ter ponuja skrbno izbran nabor vinilnih plošč, od globalnih elektronskih hitov do redkih lokalnih biserov. Onkraj zabojev z vinili obiskovalce čaka pester izbor DJ opreme, ekskluziven streetwear slovenskih oblikovalcev in edinstveni umetniški izdelki, zravn pa še specializiran head shop in premium izbor konoplje.\n" +
        "Kar Big Nose resnično loči od drugih, je njegova vloga dinamičnega kulturnega laboratorija, kjer je odkrivanje spodbujeno na vsakem koraku. Notranjost je premišljeno zasnovana predvsem ko »prostor za druženje«, s posebnimi postajami za poslušanje plošč, kjer se lahk izgubiš v novih zvokih, in mini knjižnico, polno alternativne literature. Ko neuradna info točka za ljublanske subkulture trgovina ponuja vrata do skritega utripa mesta in je nepogrešljiva destinacija za vsakogar, ki želi doživet pristnega duha lokalne scene.\n" +
        "Energija prostora se nenehno spreminja, ko se ta spremeni v prizorišče za intimne glasbene dogodke, okusne pre-partije in zanimive talk showe. Služi ko ključno stičišče, kjer se lokalni in tuji umetniki povežejo s svojim občinstvom skoz meet-and-greete, delavnice in spontane ustvarjalne izmenjave. Naj boš tam, da poloviš določen pres, se na delavnici naučiš nove veščine ali pa samo vpiješ atmosfero pred večernim izhodom, Big Nose ponuja veččutno izkušnjo, ki slavi trajno moč fizičnih medijev in povezanosti skupnosti.",
    },
  },
  "depo-club-zagreb": {
    type: "venue",
    internalName: "Depo club, Zagreb",
    base: {
      description:
        "DEPO klub je vodilno zagrebško underground prizorišče, rojeno iz preobrazbe nekdanjga skladišča tovarne Katran v kulturno središče s kapaciteto 500 ljudi. Ustvaril ga je kolektiv strastnih glasbenih navdušencev in veteranov scene; DEPO povezuje kulturo elektronske glasbe čez meje in ob tem slavi cel spekter zvoka – od punka, rocka in metala do swinga, funka, disca, hip hopa in raznolikih elektronskih žanrov.\n" +
        "Ta surovi industrijski prostor je postal temelj zagrebške alternativne scene in skoz teden ponuja specializirane večere, kjer se stresanje z glavo sreča z zibanjem bokov. DEPO, ki je sprva deloval ob koncih tedna, zdaj pa se je razširil na sredino tedna, neguje mednarodna sodelovanja in čezmejne povezave, s čimer je nepogrešljiva postaja za gostujoče umetnike in prilubljen dom za lokalne raverje, ki iščejo pristne underground izkušnje v hrvaški prestolnici.",
    },
  },
  "kader-grad-kodeljevo": {
    type: "venue",
    internalName: "Kader - Grad Kodeljevo",
    base: {
      description:
        "Kader v Gradu Kodeljevo ponuja živahno dvojno izkušnjo: prijazno teraso in dobro založen bar, kot nalašč za druženje, ter intimno underground klet, kjer v čudovito prijetnem vzdušju oživijo globoki techno ritmi.\n" +
        "Ta zgodovinski grad z ukrivljenimi debelimi kamnitimi zidovi in brezčasno arhitekturno prisotnostjo je postal prilubljeno stalno prizorišče Endemit dogodkov. Pristni značaj gradu – prepojen z zgodovino in obdan z avro preteklosti – ustvarja neomadeževano in skorej sveto okolje za naša snidenja. Zoperstavitev starodavnih zidov s sodobnim underground zvokom ustvarja edinstveno energijo: teža stoletij nad zemljo se sreča z utripom sodobne elektronske kulture spodej.\n" +
        "Ko ponavljajoč se dom za intimna endemitska snidenja se je Kader izkazal za več ko le prizorišče – je zatočišče, kjer zgodovinska duša gradu objame surovost techna, kjer ukrivljeni kamniti hodniki plesalce vodijo v zatemnjene prostore kolektivne transcendence in kjer se vsak dogodek zdi hkrati globoko zakoreninjen in brezčasno svoboden.",
    },
  },
  kampus: {
    type: "venue",
    internalName: "Kampus",
    base: {
      description:
        "Kampus se nahaja v srcu Ljubljane ob Pivovarni Union, nasproti parka Tivoli, le streljaj od križišča Tivolske in Celovške. Zlahka je dostopen s Celovške ceste, dosegljiv z več oblikami javnega prevoza (postaje LPP in BicikeLJ so v neposredni bližini), večje parkirne površine pa so prav tako na voljo v bližini.\n" +
        "Študentski Kampus je osrednje stičišče, kjer se underground zvoki srečajo s študentsko ustvarjalnostjo. Poleg tega, da je platforma za razvoj idej in projektov, se Kampus spremeni v intimno zatočišče za techno snidenja – kraj, kjer se telesa gibljejo v sencah, kjer bas odmeva skoz betonske zidove in kjer plesišče postane pribežališče za nočne pohajkovalce. V temi kampusa ustvarjamo prijetno vzdušje, kjer raverji najdejo svoje pleme, se izgubijo v glasbi in doživijo surovo energijo underground kulture.\n" +
        "Z infrastrukturno podporo in etiko dostopnosti Kampus skrbi, da te preobrazbene izkušnje ostanejo dosegljive za študentsko skupnost in vse, ki iščejo zavetje na našem plesišču.",
    },
  },
  "kino-siska": {
    type: "venue",
    internalName: "Kino Šiška",
    base: {
      description:
        "Kino, zgrajeno leta 1961, ena prvih modernističnih stavb v Ljubljani, ki se je leta 2009 znova rodila ko Center urbane kulture. Katedrala je njena glavna dvorana – 743 kvadratnih metrov pod visokim stropom, prostor za več ko 900 ljudi in ozvočenje, zgrajeno za riderje, ne za kompromise.\n" +
        "Ime se prilega. Dvorana ima proporce ladje in akustiko nečesa, kar je bilo zasnovano z namenom. Kjer koli stojiš, se oder zdi blizu – redka kvaliteta v prostoru te velikosti.\n" +
        "Za Endemit je Katedrala največji oder, na katerem smo organizirali, in najprestižnejši prostor v mestu. Kraj, kjer se slovenski underground sreča s pravo infrastrukturo: zvokom, celotno produkcijo in stavbo, ki že več ko petnajst let gosti najpomembnejša imena sodobne glasbe.\n" +
        "Ko v Katedralo prinesemo techno, modernistična lupina opravi polovico dela. Ostalo je naše.",
    },
  },
  libelice: {
    type: "venue",
    internalName: "Libeliče",
    base: {
      description:
        "Naše festivalsko prizorišče, ugnezdeno v Libeličah na slovensko-avstrijski meji, ponuja zatočišče, kjer se prepletata narava in glasba. Neomadeževana reka Drava te vodi skoz bujne travnike in starodavni gozd ter ustvarja idilično kuliso za transcendenco.\n" +
        "Ta skrbno oblikovani prostor ponuja vse osnovno – čista stranišča, tople prhe, hranljivo hrano, osvežilne pijače in pokrite prostore za tiste nepričakovane trenutke dežja – kar ti omogoča, da se popolnoma predaš izkušnji brez skrbi.\n" +
        "Že leta je to naš temelj, naša sveta zemlja za poletna snidenja. Tu, pod odprtim nebom in krošnjami dreves, se razpustimo drug v drugega in v glasbo ter izgubimo občutek za čas, medtem ko Drava šepeta ob našem kolektivnem ritmu. Tu se plesišče sreča z zemljo, kjer se prijateljstva poglobijo in kjer se meje med seboj in okolico zabrišejo v nekaj čudovito nedoločenega.\n" +
        "Sem se vračamo, sezono za sezono, da se spomnimo, kaj je pomembno.",
    },
  },
};

async function main() {
  console.log("Venues:");
  for (const [uid, t] of Object.entries(VENUES)) {
    console.log(`\n${uid}:`);
    await migrateDoc(uid, t);
  }
  console.log("\nVenues done.");
}

main().catch(err => {
  console.error("Venues migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
