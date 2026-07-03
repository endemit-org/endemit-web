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
  viharniki: (() => {
    const intro =
      "Sistem je bil nekoč skrojen po meri ljudi, tko kot so se sosedje navadli en na drugga utrip. Pozablen kraj se je lahk spremenu v prizorišče – živ pa brez meja, ko zvoki, ki pozdravlajo nov sončni vzhod.\n" +
      "Scena – ujeta med pravila obnašanja pa prosti trg – ne ponuja odrešitve.\n" +
      "Odveza čaka ob zaklučku druge endemitske klubske sezone – za tiste, ki so prpravlen stopit nasproti naslednji nevihti pa vzet nazaj, kar je blo zgublen.\n" +
      "Revolucija ne bo predvajana po televiziji – posneti bojo sam seti za rodove, ki šele pridejo.";
    return {
      type: "event",
      internalName: "Viharniki",
      base: { description: intro },
      bios: {
        pulso:
          "Pulso pride vso pot iz Argentine, da naši tradicionalni techno sceni predstavi edinstvene eksperimentalne, hipnotične pa analogne zvoke in z loopastimi sci-fi miksi razburka psiho pa plesišče. Joelove produkcije so opazle vlke založbe, ko sta SRIE pa Semantica, ampak njegove sposobnosti se še zdaleč ne končajo pri miksanju pa produkciji. Poleg tega, da izdaja svoje kvalitetne stvari, Pulso sodeluje tut z založbo Histéresis, kjer masterira zvok pa oblikuje grafiko za njihove digitalne pa kasetne izdaje. Njegova umetnost nadrealističnih analognih kolažev odseva njegov stil za mešalko. Ne pričakuj nič manj ko nekaj izven običajnga.",
        rhaegal:
          "Našo endemitsko nevihto bo zakluču Rhaegal s svojimi ritmičnimi rjovi pa temnimi bliski – rezljajo tko globoko pa gladko ko zmerm in za zmerm premaknejo razmerje moči v Kadru.\n" +
          "Bobijevo natančno miksanje, točne selekcije pa močni closingi so ga naredli za hišno zvezdo, ki nikol ne razočara svojih groupijev. Postal je ključni člen endemitske ekipe, ki vodi naš sveže zagnan Emit podcast in ob tem še zmerm najde čas za nove mojstrovine, ki bojo kmalu izšle na njegovi lastni založbi Hands of the Creator.",
        kathron:
          "Kathron nam je večkrat padla v uho, njeni vsestranski nastopi so se sešteli v že zdavnaj zaslužen endemitski poziv. Znana po svojih Clockwork Voltage live nastopih pa DJ sessionih po lokalnih underground prizoriščih je začela vodit tut glasbeno oddajo Flash Forward na Radiu Študent, kjer je prej ko tonska tehnica podpirala njihov program alternativne glasbe. Katjin prvi endemitski warm-up debi bo surov, a čustven prikaz njenga glasbeno-inženirskga znanja, njene ljubezni do modularnih sintov pa založb, ko so Token, Blue Print ali Illegal Alien Records.",
      },
      slices: {
        0: { primary: { content: intro } },
        2: {
          primary: {
            title: "Na volo na dogodku",
            description:
              "Uradni Endemit merch, sveže izdan MMalijev EP Issun-bōshi pa še kej te čaka pred vhodom v petek zvečer.",
          },
        },
      },
    };
  })(),
  "pod-svobodnim-soncem": {
    // Poem slice is already Slovenian — left to fall back. Only bios translated.
    type: "event",
    internalName: "Pod svobodnim soncem",
    bios: {
      "vinter-brothers-b2b":
        "Brata Vinter sta za zdej še na prostosti. Odkar nimamo več pravih zim, sta haloška matadorja zbrisala svoje prihranke iz hibernacije pa vse vložla v glasbo, tekočine pa tobak. Če maš vsaj povprečno kilometrino, je vlka verjetnost, da te je vsaj eden od bratov že prerivo čez plesišče, da so metri šli v rdeče številke. Karirasta sta na Euru 2024 na žalost dobla tko težko skupino, da sta obupala nad hrvaškim nogometom in oba prihranla svoje bojne krike za netenje domačih tribun Pod svobodnim soncem.",
      rhaegal:
        "Šoštanjski endemiti so izjemno redki. Leta 1635 je v Kajuhovi deželi ekipa pruskih konkvistadorjev prvič odkrila jamo, kjer so po strogi analizi med bogatim nahajališčem močnih šaleško-koroških bomb identificirali Rhaegala // Bobija. Od takrat je na plano prišo sam 2 do 3-krat, zato je še zmerm bl bled ko A4 list. Čas je, da mojster tehnično dodelanih pa z minerali bogatih underground ritmov strese ljublansko kotlino do te mere, da bo vsem kristalno jasno, ka se zgodi, ko 400 let fermentiraš najbol kristalno underground glasbo. Tempo bo na frekvencah, ki jih bomo komaj dojeli, zato se moramo prpravit, snet čelade dol pa pržgat jamarske svetilke, drgač bomo do konca še bl bledi ko on.",
      mmali:
        "Koroškga vojvodo underground glasbe so ustoličili približno 30 let nazaj. V časih, ko narava uničuje vse na svoji poti, politiko briga sam to, kk bi si napolnla lastne žepe, mednarodne organizacije pa so tko ali tko sam en cirkus, nam je MMali / Issun-bōshi dal vedet, da še ni reko zadnje. Glavni endemit s severa je po svoji aprilski epizodi v Svarogovem panteonu cevo leto pridno gojo čilije, zravn pa glasbo, tko pekočo, da bi na kolena spravla clo babuško. Za vse tiste, ki iščejo tolažbo v praznih obljubah pa prave vere ne najdejo v sebi, bo od temne noči do rdečga jutra narekvo tempo nove poganske vere, ko bomo Pod svobodnim soncem okusli zadnji košček svobode, predn nas požre stroj kapitalo-histerije, ki smo ga sami ustvarli. Vsi mate bit v prvi vrsti.",
    },
  },
  "issun-boshi-vinyl-release": (() => {
    const intro =
      "Po desetletju kreativne blokade pa umetniške rasti bo MMali predstavu svojo prvo vinilno izdajo, poimenovano po njegovem alter egu Issun-Boshi, palec velikem samuraju, ki premaga vse ovire, da osvoji srce princese – sprejme svoje pomanjklivosti pa jih prerase. Na tej poti ga spremla njegov brat po srcu pa mojster Ed Davenport, znan tut ko Inland; MMali 20. septembra v Kadru odpira novo poglavje življenja in svojim miksarskim dosežkom dodaja še produkcijske. Prvič bo v njegovem warm-up setu zazvenela njegova lastna produkcija, ki jo boš lahk kupu ekskluzivno na dogodku. In kdo bi lahk to posebno endemitsko edicijo zaprl bolše ko Inland sam – brat, ki je masteriral zvok prve endemitske EP izdaje.";
    return {
      type: "event",
      internalName: "Issun-bōshi vinyl release",
      base: { description: intro },
      bios: {
        inland:
          "Inland zapira endemitski vinilni dogodek ko posebni častni gost – MMalijev kreativni pa duhovni brat po srcu, ki je masteriral Issun-Boshi EP pa prispevo svoj remix. Ed je britanski producent pa DJ z rezidenco v Berlinu, kjer redno izdaja razskovalni techno pa ambientalne produkcije na svoji domači založbi Counterchange, težje stvari miksa v Berghainu ali pa razburka ponedelkova jutra v Panorami. V Kadru bo svoj techno set začo ko Inland, ob zori pa lahk pričakujemo več igrivosti.",
        mmali:
          "MMali, ki se je uveljavu ko eden najbol kreativnih pa vsestranskih slovenskih underground DJ-jev, bo svoji RA biografiji zdej dodal še produkcijske veščine. 20. september je zgodovinski datum za Mateja pa njegovo endemitsko ekipo – uradna izdaja njegovga prvga EP-ja na njihovi domači založbi. MMali bo floor v Kadru ogrel s svojimi lastnimi komadi, močno obarvanimi z njegovo ljubeznijo do melodičnih pa perkusivno bogatih žanrov pa selekcijami, ki jih dela, ko miksa ko Issun-Boshi, njegov ambientalni alter ego.",
        rahul:
          "Rahul ko najmlajši član Endemita za mešalko prinese svojo značilno predanost pa skrben pristop in ogreje mrzlo teraso s skrbno izbranimi beati. Znan po tem, da nikol ne pusti stvari na pol, te bo vodu skoz razvijajoče se zvočno popotovanje – od hipnotičnih groovov, ki pregnajo mraz, do postopnga stopnjevanja energije, ko množico prpravla na spust v glavni floor v kleti.\n" +
          "Ko ne drži trdnjave za Endemit, Rahul razskuje underground s svojo obalno ekipo RÆHAT in v nocojšnje uvodno poglavje prinaša sveže poglede iz koprske pristaniške scene.",
      },
      slices: {
        0: { primary: { content: intro } },
        2: {
          primary: {
            description: "Prva založniška izdaja MMalija. Limitirana edicija, prvi pres.",
          },
        },
      },
    };
  })(),
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
