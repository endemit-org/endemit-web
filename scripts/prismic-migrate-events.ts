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
  "atomski-vek": {
    // Poem slice (haiku) is already Slovenian — left to fall back.
    type: "event",
    internalName: "Atomski vek",
    base: {
      description:
        "Vsak jutro se zbudimo v svet skonstruiranih (dez)informacij. Orožarski posli tuki, carine tam. Vsak dan iste grde face, sam profil je vsakič drgač zgeneriran. Denar se kuje pa preusmerja v industrijo smeti, sam Adamu s šestimi prsti ni treba plačat davkov. Zahod proti vzhodu, mi pa smo nekje vmes. Ko ko smo bli mejhni, ko si bil ali vzhodna ali zahodna stran, Biggie proti Tupacu.\n" +
        "Takrat sta bla vsaj glasba pa ljudje na takem nivoju, da si lahk povsod do konca prižgo MTV pa je cela dolina skakala v zrak. Dons si vsak v ušesa naštima svoj algoritem ali pa ga melje skoz telefon na TikTokTeknu. Skorej nobeden več ne dela na tem, da bi bombe lekcije letele iz zvočnikov ali s košarkarskga igrišča, namest iz zraka. Skorej nobeden si več ne vzame časa, da bi iz sebe pa svojih analognih misli neki ustvaru. Ljudje sam obljublajo, realizacija je kurba.\n" +
        "Nikol ne veš, ka nas bo jutri zadelo. Ampak veš, da 25. aprila poči, bl ko vsa ta sranja v atomskem veku. Da bo endemitsko pleme zmerm delal na tem, da cementira opeke nazaj skupej, kar se kr naprej kruši v deželi zahajajočga sonca. Ne odlašaj, predn tut naš signal neha vlečt skoz vse gore brez vrhov.",
    },
    bios: {
      "wata-igarashi":
        "Wata Igarashi je eden najbol prepoznavnih pa spretnih producentov v svetu techna, pa vseeno se pri njem še zmerm močno pozna spoštovanje do pristnih prizorišč pa iskrenga občinstva. Z vrsto EP-jev na založbah, ko so Semantica, Midgar ali The Bunker NY, Watovo ustvarjanje izstopa po tem, da žanru doda poseben okus – združuje energične pa sanjske kristalne strukture z globoko intenzivnostjo in se potaplja v psihedelične sfere techna.\n" +
        "Japonci majo svoj lasten sound – prepoznaven, globok pa nemogoče ga je ignorirat. Ko nam je prvič padu v uho, smo vedli. To je to. Od tistga trenutka naprej smo vedli, da moramo ta sound prpelat v Slovenijo, kadarkoli je mogoče, sam zato, da ostanemo na pravi poti.",
      vermisst:
        "Vermisst je senčna uganka slovenskga elektronskga sveta, znan po svojih globokih, atmosferskih produkcijah, ki razskujejo meje ambienta pa techna. Njegove izdaje pri spoštovanih založbah, ko je Hypnus, kažejo prefinjen pristop k oblikovanju zvoka in spajajo hipnotične ritme z vsrkljivimi teksturami. S subtilnim pa introspektivnim pristopom Vermisst vnaša red v kaos nepredstavljivih zvokov in se postavlja ko edinstven glas underground elektronske scene. Njegovi live nastopi nosijo isto zadržano intenzivnost in občinstvu ponujajo meditativno, a močno izkušnjo.",
      obscur:
        "Obscur, naš predan podpornik pa izjemen producent, znan po svojih globokih, brezčasnih techno stvaritvah, bo končno posvetu endemitski DJ pult. Z neprekosljivim ušesom za detajle pa kreativno vztrajnostjo je umetnik svoje vrste, ki se izogiba minljivim trendom, da ostane zvest čistemu bistvu žanra. Njegovo delo z uglednimi založbami, ko so Modularz, Paralelo pa Newrhythmic, dovol pove o njegovi predanosti mojstrenju produkcije.\n" +
        "Ko DJ svoje sete sestavla z natančnim namenom, da ujame pravi momentum. Naj bo v studiu ali za mešalko, njegova želja, da dostavi prefinjen pa inovativen sound, je tko neusmiljena ko njegova strast do glasbe.",
    },
  },
  "srecno-kekci": {
    // Poem slice is already Slovenian — left to fall back.
    type: "event",
    internalName: "Srečno Kekci",
    base: {
      description:
        "V vrtco si še hoto bit Kekec, paglavc s kahlo na buči, ki prevrača pastirje v blato, rogovili po gozdu pa nastavla zanke učiteljem, ki so nasedli nedolžnemu otroškemu nasmehu.\n" +
        "Ko froc si se še upo pogledat Mojci pod krilo pa ji rečt, da se ne bojiš Volka. Če je kolega skočo v grabn, si skočo za njim. Ko si pado z drevesa, si požro solze, ker je blo cmeravcem prepovedano splezat nazaj gor.\n" +
        "A še zmerm hočeš bit Kekec?\n" +
        "Si se prvezo na drevo s kreditom? Si prodal kožo kapitalu, se skril v lukno javne uprave? Si upaš strgat korenček šefu, ki ti jemlje pravico do odklopa? Ukrast siroto Bedancu, ker z njim ni srečen, kapljice teti Pehti, da spregledaš? Si upaš it do gore, predn se ti ona postavi na pot?\n" +
        "Hotli so nam prepovedat drva, bojlerje, gavde. Iz endemitskga naroda so naprajli nomade. Ko so nam nastavlali ovire, bi lahk vložli Rožleta. Lahk bi obstali nad samotnim breznom, pa smo rajš šli po volčji sledi na novo pot do Kadra.\n" +
        "Prvo leto preizkušenj je za nami, mi pa še zmerm povsod sejemo voljo do lajfa. Kreativa ostaja.",
    },
    bios: {
      pvtr:
        "PVTR, mlajši pa nežnejši od dveh bratov, bo prebil led na plesišču in nam topu srca postopoma z vse debelejšimi beati, dokler ne bomo prpravlen, da nas zažge ogenj najstarejšga. Njegov pomirjujoč začetek nas bo popelo skoz spomine na pretekle napake – vsak boleč spomin ko groba iver, ki jo nahrani plahim plamenom, da naredi prostor svetlejši prihodnosti. Patrik je naša luč na koncu tunela, zaradi katere bomo pozabli, da tema nima konca.",
      vinter:
        "Vinter je veliki brat, ki nam nikol ne olajša življenja, ker ve, da je lekcija, naučena po težji poti, tista, ki obstane za zmerm pa nas prpravi na trdo pot pred nami. To zimo se vrača, da naše tavajoče duše zažge v svojem kresu trdih beatov pa čudežnga drevja, dokler ne vstanemo iz pepela ko pravo Svobodno ljudstvo, prpravlen pisat zgodbe prihodnjih grehov, ki prežijo na tiste, ki si dajejo novoletne zaobljube.",
      mmali:
        "MMali se končno prebuja po mesecih hibernacije, da zaklučimo našo Kekčevo trilogijo. Če smo iskreni, je naš vodja klana zver, ki v resnici nikol ne hibernira pa ne spi. Medtem ko je njegov nežnejši alter ego ogreval odre ex-yu prestolnic, je MMali produciral svoje globoke komade pa uspel prenapolnit svoj ključek s Trance, dance pa trap temami, da bojo dekleta vrtele boke, fantje pa se skrivaj cerili med njegovo glavno techno karto. Sam najbolše bo prišlo skoz neusmiljeno selekcijo njegovga izostrenga ušesa, da postane trending hit leta 2025.",
      "mima-and-zazi":
        "Mima & Zazi, neverjeten dvojec čudnih barv, glavni zvezdi našga funky odra nad zemljo, bosta prestrašenim obrazom vrnili nasmeh, ko si bojo vzeli odmor od Vinterjevih techno rjovov spodej. Prpravi se na disco, house pa funk gibe, da v novo leto vstopiš brez poškodb kolkov.",
      spati:
        "Špäti, mati kadrovskih otrok, pol pometalka floora pol umetnica, bo zaprla plesišče tete Pehte s house napoji pa drugimi skrivnimi sestavinami. Opisana ko absolutno ekstatična, morda ima to, kar je treba, da preživi dlje ko MMalijev underground nastop.",
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
  "cvetke-v-jeseni": {
    // Long Slovenian satire poem already in base — left to fall back.
    type: "event",
    internalName: "Cvetke v Jeseni",
    base: {
      description:
        "Poletje nam krade jesen, jesen ne uspe dočakat zime, mi pa plešemo pod svobodo pa se navajamo nove plime. Za digitalni prehod brez garancije se prerivamo v vrsti, E-milja z lučkami vsakmo dostavi na dom po pošti. Miljardo smo našli za flete, Finančič drugo leto plača progresijo, kupujemo obveznice, Brodnjak nam dnar prepoceni obrača. Z Goričkga v Piran pičimo v šesti, Alenka z brati riše nov pas, asfalt špura do Koroške, Slovencem z rovt se dobro piše.\n" +
        "Ni več bedaka za junaka, ki bi še delo za minimalca, vrednost dodajamo vsem, ki se izognejo inflaciji davka. Vrečko za kolege zrihta šiht, kult'ni projekti so postali dragi, Cankarja bi po porazu rajš poslali na olimpijske po zmagi. Za biznis se nafta najde brez trošarine, subvencije za limuzine, za socialce mamo eko fasade, pozimi TEŠ, da nam greje doline.",
    },
    bios: {
      "amanda-mussi":
        "Brazilska DJ-ka pa producentka Amanda Mussi je znana po svoji edinstveni fuziji techna, acida pa housa, kjer spaja zvoke, navdihnjene z živahnih ulic južne pa severne poloble. Ko ne oblikuje underground scene v São Paulu ko del kolektiva Mamba Negra, navdušuje občinstva na alternativnih odrih v mestih ko so New York, Stockholm, Amsterdam pa Berlin. Poleg mešalke ustvarja pa izdaja glasbo prek paragvajske založbe Massa Records, s srcem pa podpira male, lokalne underground scene in prek svoje booking platforme povezuje pa dviguje južnoameriške umetnike.",
      mmali:
        "Issun-bōshi predstavla mehkejšo, bol introspektivno plat MMalija, ki razskuje melodične komade s čistimi ritmi, ki presegajo običajne meje techna pa housa. Njegovi closing seti pogosto vsebujejo trance klasike, prepletene z rap pa pop elementi, njegovi opening seti pa zavzamejo bol čustven ton pa se potapljajo v globoke pa ambientalne pokrajine. Njegove skrbno izbrane selekcije se lahk podajo tut v post-rock pa synth-pop in poti dodajo globino. Čeprav je MMali stalnica slovenske underground elektronske scene, so nastopi pod njegovim nežnejšim alter egom redki – kar jih naredi še bol vplivne pa nepozabne.",
      rhaegal:
        "Šoštanjčan Rhaegal je eden redkih lokalnih DJ-jev, ki ne obvlada sam umetnosti brezhibnga miksanja vinilov, ampak se lahk pohvali tut z močnim produkcijskim ozadjem in izdaja komade prek svoje založbe Hands of the Creator. Čeprav se zdi, da koplje sam po najtemnejših pa najbol skritih kotičkih neodvisne elektronske scene, se ravno ob pravem trenutku prikaže žarek melodije – predn te neusmiljen ritem potisne v globine še neodkritih odtenkov techna. Njegov sound je popotovanje, ki uravnoteža intenzivnost z momenti nepričakovane lepote.",
    },
  },
  "ende-mit-25": {
    type: "event",
    internalName: "Ende mit 25",
    base: {
      description:
        "2025 je bil za nas produktivno leto. Endemit festival smo nadgradli z dnevnim odrom, klubski program pa s poletnimi spin-offi. Ustanovili smo tut kulturno društvo, na naši novi založbi izdali MMalijev prvi vinil Issun-bōshi, rekrutirali Obscurja pa zagnali Emit podcast, ki ga kurira še en ključni endemitski umetnik, Rhaegal.\n" +
        "Ker smo pričakovanja postavli više ko novoletno smreko, smo se odločli to plodno leto zaklučit s posebno endemitsko novoletno edicijo – rekrutirali smo najbol prominentne lokalne umetnike, da nastopijo na dveh odrih, pa držali vrata odprta do bruncha.\n" +
        "Ne daj si novoletnih zaoblub, ki jih ne moreš držat. Daj si pravo pa se pridruži plemenu za letni reset.",
    },
    bios: {
      rhaegal:
        "Boter closingov, služabnik globokih zvokov pa razskovalec temnih ulic je sprejel izziv, drznejši od katerekoli novoletne zaobljube. Rhaegal stopa v čevle, ki jih še nikol ni nosu, in je ko zmerm prpravlen ogret glavni floor v Kadru.\n" +
        "Sam Bog odpušča grehe leta 2025 in sam Bog ve, ka nam je Bobi tokrat prpravu. Ampak ena stvar je že trdno vklesana v kamen – naslednja endemitska release fešta bo v rokah Stvarnika (Hands of the Creator).",
      tonske:
        "Iz libeliških gozdov še zmerm odmeva hvalnica, kjer je Tonske dostavu tko dodelan pa pretresljiv set, da je pleme zahtevalo revanš pri višjih obratih. Nismo mel druge izbire, ko da za našga posebnga častnga gosta rezerviramo glavni slot na tradicionalnem endemitskem novoletnem – tut lokalni patriot, ki v Velenju jaše s svojo ekipo Cogo. Antonio je izkušen umetnik, znan po tem, da ustvari popoln flow groovastga, minimalnga techna pa v glavnih urah pritiska z ritmom.",
      mmali:
        "MMali se ubada z odtegnitvenim sindromom, odkar je moral svojo Issun-bōshi vinilno release fešto zaprt tko, da je prevzeu še glavne ure in pokru svojga na letališču obtičalga brata Eda/Inlanda.\n" +
        "Zahvala bogovom Kadra, ki so se odločli držat vrata odprta do brunch časa, je Matej dobu priložnost, da se spet prekosi z novim neskončnim closingom – tistim, ki ga zmerm nesemo domov s ponosnim nasmehom, še zmerm potopljeni v plemenski trans.",
      meelo:
        "Ker sta bila dva floora z dvema zasedbama za napolnit, smo razmišljali izven svoje ekipe pa rekrutirali še enga lokalnga podpornika, frontmana benda re|lined. Meelovi seti so znani po natančnosti, groovastih ritmih s temnimi temelji, hipnotičnem ponavljanju pa subtilnih prehodih.\n" +
        "Jan se nam je pridružu na prvem Endemit festivalu in od takrat prpravu intenziven nastop na drugih odrih, tko da je bil očitna izbira za ogrevanje floora pred Obscurjem.",
      obscur:
        "Ker se je Obscur pridružu endemitski ekipi, smo za to novoletno edicijo morali potegnt težke topove pa dobit drugi floor, da našo novo vzhajajočo zvezdo damo na zasedbo.\n" +
        "Tim je vsak nastop pa produkcijo prestal s hipnotičnimi barvami, dobival vabila na odre ko Kino Šiška, svoj čist industrijski sound pa izdajal na založbah ko Moving Pressure, Modularz pa Newrhythmic. Čist naravno je, da Obscurju podelimo dar še enga closinga pa mu pustimo, da narekuje tempo za 2026.",
    },
    slices: {
      1: {
        primary: {
          content:
            "2025 je bil za nas produktivno leto. Endemit festival smo nadgradli z dnevnim odrom, klubski program pa s poletnimi spin-offi. Ustanovili smo tut kulturno društvo, na naši novi založbi izdali MMalijev prvi vinil Issun-bōshi, rekrutirali Obscurja pa zagnali Emit podcast, ki ga kurira še en ključni endemitski umetnik, Rhaegal.\n" +
            "Ker smo pričakovanja postavli više ko novoletno smreko, smo se odločli to plodno leto zaklučit s posebno endemitsko novoletno edicijo – rekrutirali smo najbol prominentne lokalne umetnike, da nastopijo na dveh odrih, pa držali vrata odprta do bruncha.\n" +
            "Ne daj si novoletnih zaoblub, ki jih ne moreš držat. Daj si pravo pa se pridruži plemenu za letni reset.",
        },
      },
    },
  },
  "odprava-zelenega-zmaja": {
    // Poem already Slovenian — fall back.
    type: "event",
    internalName: "Odprava zelenega zmaja",
    base: {
      description:
        "V mestu, kjer uspeva sam mladina ko cvetlice s trate, na kraju, ki ni zapisan na naši koži, obdan z balkanwave mladino v maturantskih majcah. Včasih, ko te avantgardna nadrealnost endemitske izkušnje izpusti in ko stvari postaviš v perspektivo, se zdi nemogoče, da si bil včeraj res tuki. V Ljubljani, zravn Uniona.\n" +
        "Tko kot voda vreže pot skoz dolino, je endemitska familija vrezala pot za občutke, za katere smo se bali, da jih je odnesu Zokijev bager. Seme odprave zelenga zmaja je blo pravzaprav tko močno, da še gentrificirana ljublanska prst ni mogla preprečit, da bi se klasika ponovila na nivoju starih časov.\n" +
        "Da kljub obupu ljublanskih klubov pa influencerskih dogodkov še zmerm obstaja odporniško gibanje, kjer lahk slišiš set stoletja pa se skriješ pred budnim očesom egocentričnih posameznikov, ki v slepoti strahu pred inflacijo vrednosti svojga življenja iščejo dodatnga followerja, da si zagotovijo svojo new-age bazo za preživetje.\n" +
        "Narava endemitskih mojstrov, divja ko cvetlice s trate, ti je spet narisala luči, zvoke, besede pa občutke, ki jih boš v življenju na žalost doživu premalokrat. V ponedelk, ko gremo vsak na svoj šiht, se lahk sam rahlo nasmehneš pa si rečeš, da bo za nekaj časa zdržalo.",
    },
    bios: {
      tamorra:
        "Človek vsrka okolje ali pa okolje vsrka človeka. Naslednji vodja je produkt slovenske Istre pa endemitskih bojnih vrst, ki je svoje talente osebno pa intenzivno vložu v obe pokrajini. Z obalnimi fanatiki jim je v samo nekaj letih uspelo iz suhe, zapuščene planjave sestavit par ducatov puščavskih krožnikov novga obalnga techno ekosistema.\n" +
        "Tamorra je s študijem terenov na prejšnjih endemitskih snidenjih v sebi prebudu prvinske instinkte usodne privlačnosti. Med njim pa nami, med glasbo pa umom, med intimnim ritualom pa osvoboditvijo od okovov zgodnje odraslosti. Če bi ta film snemali dons, bi bil Matija eden glavnih razlogov za disco. Čas je, da svoj kos položi na našo mizo.",
      inland:
        "Ljubljana se je zgubila v času. Zlata doba je konc, ostali so sam ostanki tega, kar je nekoč blo. Kljub našim trudom nas včasih vse odnese, zato se moramo podat v svet, kjer ostajajo zvesti svoji poti.\n" +
        "Prijateljstva, ki so se spletla pred mnogimi polnimi lunami, se krepijo ne glede na razdaljo. Čeprav je Nemčija baje v energetski krizi pa Berlin v čustveni, še zmerm najdeš kakšen reaktor, ki ga niso zadeli virusi človeškga intelekta. Še zmerm je mogoče najt closing, ki ti odpre nove dimenzije, čeprav si mislu, da si svojo že doživu. Še bolše, ko pride od tistih, ki premorejo vrlino, ki je večina v sebi ne zmore več najt pa udejanit. Lahko je govorit, ampak bit prisoten pa vztrajat na svoji poti več ko desetletje – to uspe sam peščici ogroženih samotarjev.\n" +
        "Ed Davenport / Inland je eden tistih, endemit, ki te vrline pa človeške kvalitete več ko uteleša. S koreninami v predbrexitovski Angliji je na sceno prišo v zlatih analognih dneh, ko so tablete še vsebovale pravo mešanico sladkorja, svet pa je vse stavu na kvaliteto v white labelu. Skoz leta je ta produkcijski guru zgradu močan repertoar – ni templja, ki ne bi blagoslovu njegovih spomenikov. S svojima domačima založbama Counterchange pa BRETT nenehno melje naprej pa načrtuje nove zvočno-arhitekturne projekte, da stabilizira temelje za naslednje XYZ generacije.\n" +
        "V zaspanem mestu so priložnosti za renesanso duše redke. Če se hočeš zbudit iz hibernacije pa ne verjameš, da sončni žarki pa Instagram vse pozdravijo, te prava terapija čaka kar za vogalom kampusa.",
      mmali:
        "Leta 1976, ko so snemali tisti film, je zamudu na casting, zato je svojo vlogo odigral na koroških poljanah mladinskih revolucij. Takoj ko je skalibriral koroške avtohtone gozdove ob Dravi, se je njegov prepoznavni sound preselu v Ljubljano, kjer še dons trem generacijam trznejo noge, ko omeniš, da pride za mešalko.\n" +
        "MMali / Issun-bōshi izpušča zmaje, medtem ko jih drugi lovijo, pa gradi čustvene mostove, za katere smo že zdavnaj mislu, da bojo ostali nekje na hodnikih spominov iz mlajših let – ko je bas še odmeval iz Roga. V časih, ko lažni guruji na podcastih svetujejo, da moraš vsak dan delat na sebi, boš zase naredu največ, če boš ob pravem času – v prvi vrsti.",
    },
  },
  "ius-primae-noctis": {
    // Poem already Slovenian — fall back.
    type: "event",
    internalName: "Ius Primae Noctis",
    base: {
      description:
        "Ne tko dolgo nazaj, ne tko daleč nazaj, si še lahk stakno frajlo brez Tinderja. Takrat nisi rabu kredita, da si jo poroču, pa še enga, da si jo odplačo.\n" +
        "V časih inceljev, kjer je inflacija vzela 40 % za nov avto pa so frustrirani, ker se morjo vozit po Sloveniji, ker ne dobijo punce, je čas, da se vrnemo h koreninam – ko si Marijo še vprašo, če jo lahk poližeš, pa nato vljudno počakal, da ti da privolitev.\n" +
        "Ius primae noctis, pravica underground fevdalcev, da razširijo obzorja nezadovoljnih devic, bo uveljavlena pred nočnim vrhuncem že na terasi pod kodeljevskim soncem.\n" +
        "Papež Leon XIV. je odredu, da za zakrament svete endemitske zveze ne bo potrošniškga kredita. Pravi podložniki so že prpravli kresniški davek za prvi seks ob poletnem sončnem obratu.\n" +
        "P.S.: Na Koroškem tega zgodovinsko netočnga fevdalnga zakona nismo priznavali, ampak zmerm smo vedli, da mora Ajda pošteno dozoret, predn jo prvič na prvi fešti.",
    },
    bios: {
      mokilok:
        "Mokilok, naš prilubljen festivalski rezident, se vrača – tokrat za svoj dolgo pričakovan debi v grajski kleti. Do zdej so njegovi seti zmerm odmevali pod odprtim nebom, zdej pa njegov sound prinašamo v zaprte prostore, kjer bojo kamnite stene ujele pritisk. Pričakuj čas ukrivljajoč spopad: klasičen '90s techno pa surov hard house proti temnejšemu, sodobnemu robu. Nazaj v prihodnost – pod obokanimi stropi.",
      "unknown-texture":
        "Unknown Texture je še eno slovensko vzhajajoče techno upanje – vseprisoten obraz na naših dogodkih, ki zdej končno stopa za pult. Znan po globoki predanosti obrti, svoj sound oblikuje skoz analogne pa modularne hipnotične ritme, globoke frekvence pa abstraktne teksture. Pravi digger pa razskovalec zvoka, ki igra sam vinil – da ga surovost voska vodi skoz popotovanje. Miha je prpravlen svojo strast prevest v set, ki odmeva daleč čez stene kleti.",
      rhaegal:
        "Rhaegal gre v natrpan junij, z nastopi vsak konec tedna, in je za to več ko prpravlen. Na ta trenutek se je prpravljal in obljublja, da bo na vsaki postaji dostavu neki svežga pa izven običajnga. Tut z več nastopi ne pričakuj ponavljanja – sam čisto, razvijajočo se energijo. Eden naših pa eden najbolših; Bobi nas bo spet spomnu, kje točno kick udari najbol.",
      mmali:
        "MMali tokrat pristaja na grajski terasi in prevzema popoldansko izmeno na najdaljši dan v letu. Znan po tem, da sprejme vsak slot – od openingov do closingov – vsak trenutek izkoristi, da deli točno tisto glasbo, ki se mu zdi najbol pomembna. Tokrat pričakuj pozablene bisere pa spregledane zaklade, obujene v življenje, da spet zazvenijo pod s soncem obsijanim kamnom.",
    },
  },
  "pohujsanje-v-kotlini-sentlublanski": {
    // Poem already Slovenian — fall back.
    type: "event",
    internalName: "Pohujšanje v kotlini Šentlublanski",
    base: {
      description:
        "V času drugga vala pustošenja SARS-CoV-2 se je v podalpsko deželo prikradu sam Zlodej, ker je prisluškoval Krekovim dušam, zgubljenim v domovih za ostarele. Ko vsak prebrisan popotnik v svežem okolju se je najprej ustavu na zasebnem kraju, kjer ga je iz zasede napadu razbojnik Peter, s kerim sta ob sončnem vzhodu sklenila peklenski dogovor – da svete cepljene duše premešata čez rob malomarnga škandala.\n" +
        "Rhaegal pa MMali sta že vse od tiste davne pogodbe, za katero nihče ne ve, kdo je bil hudič pa kdo je vse skupej plačo, ko rit pa srajca. Ampak ker njune umetniške duše verjamejo, da je hudič v detajlih, tko redko stojita drug ob drugem za mešalko, da se zmerm najde kakšen endemit, ki bi rajš jokal nad zamujeno priložnostjo. Na srečo nesrečnih pa pravijo, da v tretje gre rado.\n" +
        "Zlodej pa razbojnik bosta tokrat ogrevala za duše, kerih čednost bo preizkušena z zvočno podobo lepe Mirelle. Poči bo tolk, kolk bo nedolžnih ostalo.",
    },
    bios: {
      "mirella-kroes":
        "Mirella Kroes je skriti biser elektronske scene, ki se prikaže sam, da deli posebne momente intimnosti – kvaliteto, ki jo globoko ceni pa z njo resonira. Strastna, a prizemljena duša, polna ljubezni do narave, Mirella uteleša izrazito dvojnost, ki se odseva v njenih DJ setih. Ker daje prednost globlji, sodobni plati techna, njena selekcija komadov balansira med tem, da draži um pa začara dušo. Njeni seti se potapljajo v trippy, bol skrivnostne sfere elektronske glasbe in iz zvokov tkejo organske builde, da poudarijo vsak detajl. Vsak nastop je vsrkljiva izkušnja, tko sanjska ko prizemljena, ki na pozornga poslušalca pusti trajen vtis in ga vabi, da se poda na to transcendentalno popotovanje.",
      rahul:
        "Rahul, najmlajši član endemitske ekipe, je neutruden zgled predanosti naši skupni stvari. Znan po skrbni naravi pa močni delovni etiki, je zmerm prvi, ki priskoči, pa zadnji, ki odide, in poskrbi, da je vsaka naloga opravlena do popolnosti. Rahulova druga vizionarska družina je RÆHAT, ekipa z obale, ki pridno razskuje razburljivo novo underground prizorišče v koprskem pristanišču. Ko predstavnik Endemita v Kadru bo Rahul tokrat pokazal še eno svojo plat – svoje glasbene talente. Njegov warm-up set bo iskreno srečanje z njegovim kreativnim umom, ki te vabi, da deliš globino pa strast, ki opredeljujeta vse, kar počne.",
      "mmali-b2b-rhaegal":
        "Bil je trenutek v preteklosti, ki ga nihče ni pričakoval – trenutek, ko sta Bobi pa MMali stala hrbet ob hrbtu, en trmast igralec proti drugmo, in z enim intenzivnim komadom za drugim končevala nočne zadeve. Čeprav si nihče ni upu napovedat, ali se bo zgodovina ponovila, jima ni vzelo dolgo, da sta spoznala, da je čas, da se spet združita zavolo pravih Endemit fanov. Njuna glasba udari globoko – ne bo sam spremenila tvojga stanja duha na bolše, ampak za zmerm spremenila občutek grajske kleti.",
    },
  },
  "ende-meet-26": (() => {
    const intro =
      "To ni običajen Endemit dogodek. Ni after hours pa ni underground.\n" +
      "Čas je za Ende Meet v trgovini s ploščami Big Nose – še en sproščen petkov popoldan v družbi prijateljev, z vinili, ki se vrtijo v ozadju.\n" +
      "To je tvoja najbolša priložnost, da spoznaš ekipo. Naš prvi artist-in-focus je MMali – mož v ozadju naše prve vinilne izdaje Issun-bōshi.\n" +
      "Začnemo ob 17h. Pijača bo na volo v trgovini, zravn pa naš merch pa tvoja lastna kopija Issun-bōshija.\n" +
      "Ne zamudi. To ni parti, to je družinsko snidenje.";
    return {
      type: "event",
      internalName: "Ende Meet",
      base: { description: intro },
      slices: {
        0: { primary: { content: intro } },
        2: {
          primary: {
            headline: "Na volo na dogodku",
            description: "Poberi album",
          },
        },
        3: {
          primary: {
            title: "Merch na dogodku",
            description: "Odličen način, da podpreš našo stvar",
          },
        },
      },
    };
  })(),
  "endemit-festival-2025": {
    type: "event",
    internalName: "Endemit festival '25",
    base: {
      annotation: "Zaprt dogodek",
      description:
        "Nazaj k izviru.\n" +
        "Tisti čas leta nas kliče domov – v gozd, ki nas pozna, k zemlji, ki nas drži, pa drug k drugmo.\n" +
        "Tokrat se premikamo tiho. Brez velikih objav, brez glasnih vabil. Sam mi – pa tisti, ki jim zaupamo, da čutijo isto. Beseda potuje od prijatelja do prijatelja. Od srca do srca. Od tistih, ki slišijo tišino med basi. Skriti, a globoko povezani.",
    },
    bios: {
      "rene-wise":
        "Rene Wise dostavla močan, perkusiven techno, da razgiba gibanje. Njegov prepoznavni sound je prizemljen pa gnan – surov, a sodoben ritem, pognan v gibanje, da ustvari atmosferske zvočne pokrajine, kjer se telo pa zvok stakneta. Nikol vsiljiv, zmerm natančen pa pod kontrolo. Kurira založbo Moving Pressure, ki odseva njegovo zvočno estetiko: gol, groovast techno s perkusivnim ozadjem. Obscurjeva nedavna izdaja na tej založbi povezuje našo sceno z Renejevo skoz skupen zvočni etos – tesen, surov pa globoko občuten.",
      "beste-hira":
        "Beste Hira prinaša neustrašen pristop k dvigovanju plesišča in ponuja mirovne darove goste perkusije, abstraktnih melodij pa prepričljivih ritmov, da izvede zvočni ritual visoke energije. Pričakuj intenziven, obliko spreminjajoč set, ki nikol ne neha slediti svoji lastni pripovedi.",
      vinter:
        "Vinterjev sound zaznamuje raba kontrasta – balansira med zadržanostjo pa sprostitvijo, pri čemer zadržanost v njegovem (mind)setu nikol ni prava opcija. Njegov glasbeni okus je oster, pa nekako čustven, njegove selekcije pa z natančnostjo pa slogom v kamen postavljajo meje techna. Je zaupanja vredna prisotnost, da atmosfero potisne do meja tik pred glavnim aktom.",
      rhaegal:
        "Rhaegal je stopnjeval svoje nastope in na vsaki postaji svoje nenehno razvijajoče se umetniške poti dostavu temne mojstrovine. Njegovi closing seti so underground izkušnja obsežnega čustvenga terena, zasnovana za razskovanje notranje sfere neskončnga. Vodi tut založbo Hands of the Creator, s katero poslušalcu deli karte nezemeljskih zvokov.",
      "dj-labrana":
        "Labrana je tista redka, zvok zbirajoča zver, ki razume, da mora glasba nagovarjat um brez predsodkov. Pričakuj vzdigujočo dnevno selekcijo housa, disca pa leftfield čudakov. Igriva, a globoka, s pravo mero nepredvidljivosti v vzorcu.",
      "omnia-vox":
        "Omnia Vox je kipar zvočnih pokrajin, ki dihajo pa z lahkoto pa naravnim tokom preusmerijo pozornost k naslednji postaji neraziskanga. Z rabo ambienta, drona pa organskih posnetkov so njegovi seti nujno potrebna dekompresija – platforma za refleksijo pa reset.",
      "material-object":
        "Material Object je mojster zvočne arhitekture, ki gradi večdimenzionalno atmosfero iz abstraktnga techna, ambienta pa psihedeličnih komponent. Producent pa izvajalec, ki so ga vzeli za svojga občinstva pa založbe po vsem svetu, je svoj slog razvil skoz sodelovanja s sensejem elektronske glasbe Petetom Namlookom in svoj prepoznavni sound prinesu v prizorišča ko Berghain ali festival Labyrinth. Doma iz Avstralije, zdej postavla svoj novi hub v Sloveniji in debitira na Endemitu sred koroškga gozda.",
      beko:
        "Beko spaja hipnotične groove s surovimi teksturami pa natančno uglašenim progresivnim pridihom. Njegovi seti, igrani izključno na vinilu, so sestavlenji s potrpljenjem pa čisto zbranostjo in poslušalca vodijo skoz vzporedna stanja uma, ne da bi kdaj zgubu nit. Pravi mojster natančnga momentuma.",
      pvtr:
        "Pvtr je zarisu načrt za prepletanje ambientalnga techna z dub vplivi pa meditativnimi ritmi in spodbuja globoko interakcijo med prostornimi, a subtilnimi zvočnimi strukturami. Njegovo postopno potapljanje v prostranstvo neznanga vabi k mirovanju pa fokusu in z veliko marljivostjo pa namenom razskuje prostor med zvokom. Pričakuj premišljeno popotovanje v globine techna.",
      tonske:
        "Tonske je selektor iz Velenja, znan po natančnih, groovastih konstrukcijah, zgrajenih na minimalnih temeljih. Njegov fokus je na flowu, tesnih prehodih pa goli kontroli. Je tut um za Cogom, še eno slovensko napredno mislečo založbo, posvečeno razskovalni elektronski glasbi.",
      mmali:
        "MMali našo letno endemitsko popotovanje zaklučuje z zmerm čustvenim nastopom, oblikovanim iz najredkejših ambientalnih, trance, post-rock pa eksperimentalnih techno biserov. Njegovi seti presegajo žanre, da odsevajo njegov igriv, razskovalen pa nežno okaljen značaj, ki ve točno, kdaj plesišče razburka surovo ali pa ga nežno ziblje, in pleme potopi v občutke pripadnosti, globoke hvaležnosti pa hrepenenja po naslednjem snidenju.",
      obscur:
        "Obscur usmerja energijo v plesišče s soundom, ki je surov, industrijski pa hipnotičen. Njegovo delo z založbami Modularz, Paralelo pa Newrhythmic dovol pove o njegovih glasbenih sposobnostih, njegova strast do techno žanra pa presega njegovo producentsko osebo, da dostavi zagnane nastope. Njegovi seti so gosti pa fizični in poslušalca vlečejo proti razpoki temnga frekvenčnga območja, ne da bi zgubil zagon naprej.",
    },
    slices: {
      0: {
        primary: {
          heading: "Nazaj k izviru.",
          description:
            "Skrbno kuriran festival elektronske glasbe, obdan z reko, gozdom pa gorami.",
        },
      },
      1: {
        primary: {
          content:
            "Tisti čas leta nas kliče domov – v gozd, ki nas pozna, k zemlji, ki nas drži, pa drug k drugmo.\n" +
            "Tokrat se premikamo tiho. Brez velikih objav, brez glasnih vabil. Sam mi – pa tisti, ki jim zaupamo, da čutijo isto. Beseda potuje od prijatelja do prijatelja. Od srca do srca. Od tistih, ki slišijo tišino med basi. Skriti, a globoko povezani.",
        },
      },
    },
  },
  x: {
    type: "event",
    internalName: "[X]",
    base: {
      description:
        "10. Endemit festival, skrbno kuriran festival elektronske glasbe, obdan z reko, gozdom pa gorami.\n" +
        "Deset spektakularnih let. Let, polnih migetajočih luči med drevjem, nežnih meglic nad toplo poletno travo pa občutka zemlje pod nogami.\n" +
        "Ob slovesnosti praznovanja so na obzorju nepozabni dnevi, ki so spomenik neštetim potem pa skupnim izkušnjam našga popotovanja.",
    },
    bios: {
      sim:
        "SIM se vrača iz tretje izmene, kjer je izpiljil novo gimnastiko zvokov, ki utelešajo vse, česar povprečen človek leta 2390 še zmerm ne dojame. Da je lahk življenje tut lepo. Mišični spomin bo iz podzavesti prinesu gibe iz časov, ko so njegovi prvi zvoki strigli zeleno travo libeliških polj.",
      "kundi-institut":
        "Nekatere stvari enostavno niso iste. Naše praznovanje zagotovo ne bi blo isto brez Kundi Instituta. Človek, globoko zaznamovan z močjo našga domačga koroškga okolja, ti bo pod noge vrgu 2390 brezhibnih ritmičnih ognjemetov.",
      dvidevat:
        "Nekatere enačbe je težko rešit, druge so preproste. Združit dvidevat pa njene energične talente čez širok spekter elektronske glasbe z endemitskim občinstvom je lahka enačba. Zgodu se bo match, ustvarjen v nebesih.",
      inland:
        "Britanec, ki je našo dom v Berlinu, je odkril svoj naslednji dom v Sloveniji. Potem ko je nabu energijo na Izviru, je pusto svoj naslednji pečat na našem ljublanskem občinstvu. Ed se med nami počuti ravno tko doma ko naše občinstvo v jedru njegovih odličnih ritmov iz samga srca berlinske pa svetovne elektronske scene.",
      rotte:
        "Obalno-koroška povezava je vsak dan močnejša in spaja mediteransko svežino z vrhovi koroških gora. Rotte je glasnik novga primorskga vala drznih kuratorjev plesišča, ki v svoje stvaritve redno pakira neosvinčene atome underground zvokov.",
      meelo:
        "Frontman zasedbe re_lined je garancija za dozo dodelane glasbe. Njegova vera v glasbo odpira vrata natančnosti pa popolnosti njegovih kompozicij. Njegov nastop te bo držal v zelo visoki energiji.",
      vinter:
        "Hišno ime nikol ne razočara. Matija Vinter je legenda endemitskga plesišča, ki smo ga zaradi njegovih bomb morali neštetokrat krpat. Matija je nepogrešljiv duh naše 10-letne tradicije.",
      psyk:
        "psyk je ime svoje generacije pa eno največjih imen v naši kulturi. Svoj pečat je pusto na vseh najpomembnejših dogodkih pa v klubih, ključnih stebrih techno kulture po svetu. Španska tradicija odličnosti se nadaljuje.",
      rhaegal:
        "Nekatere stvari so usojene. Še gora med Šoštanjem pa Koroško nam ni mogla preprečit, da bi našli svojga sorodnga duha – Rhaegala. Zlitje kultur med njegovo glasbo pa koroško tradicijo je temelj za prelomne zvoke, ki jih boš doživel.",
      mmali:
        "Srce pa duša Endemita, ki je zraso iz Formavive pa postal eno najbol pričakovanih imen med predanimi ljubitelji hipnotične avantgardne techno glasbe v Sloveniji. Njegov vpliv presega njegovo ime in lahk sam ugibamo, ka bo tokrat prinesla nevihta z njim.",
      mokilok:
        "MOKILOK je veteran plesišča, ki je po prihodu iz daljne Avstralije našo dom v Berlinu, od takrat pa je neštetokrat odkril svojo dušo pa svoje ljudi v majhni vasici Libeliče. Človek iz ljudstva, bo ko zmerm poskrbu za vse plešoče duše na segretem endemitskem terenu.",
      madalba:
        "V čudoviti Madalbi se združijo kulture sveta. Ker je v svojem življenju prepotovala svet, je čist naravno, da bo tokrat z nami v skritem biseru, skritem očem celga vesolja. S sabo prinaša nepogrešljiv del berlinske kulture, ki se brezhibno prilega našim podvigom.",
    },
    slices: {
      0: {
        primary: {
          heading: "10. INTIMNO SNIDENJE",
          description:
            "Skrbno kuriran festival elektronske glasbe, obdan z reko, gozdom pa gorami.",
        },
      },
      1: {
        primary: {
          content:
            "Deset spektakularnih let. Let, polnih migetajočih luči med drevjem, nežnih meglic nad toplo poletno travo pa občutka zemlje pod nogami.\n" +
            "Ob slovesnosti praznovanja so na obzorju nepozabni dnevi, ki so spomenik neštetim potem pa skupnim izkušnjam našga popotovanja.",
        },
      },
    },
  },
  // NOTE: road-x-endemit-2025 is intentionally not here. Its cover_image points
  // to an orphaned Prismic asset which makes updateDocument re-validation fail
  // ("Assets not found"). It was localized separately by re-registering the
  // image via migration.createAsset() from its still-live CDN URL
  // (annotation_sl = "Gostujoč nastop", description_sl = "Gostujoč dogodek ...").
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
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
