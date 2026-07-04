import "dotenv/config";
import * as prismic from "@prismicio/client";
import { createClient } from "./prismic-lib";

/**
 * Localizes artist bio descriptions (Koroščina) into the planned version.
 *
 * Only `description` is translated. `name` is a proper noun → universal; meta
 * fields are empty. Descriptions are all paragraphs — we walk the source blocks
 * and replace each NON-EMPTY paragraph with the next translation in order
 * (empty spacers kept verbatim), so index gaps don't matter. Data-entry junk in
 * the English source (e.g. amanda-mussi's trailing mash) is dropped in the _sl.
 *
 * `internalName` = the doc's current `name` so the editor name is preserved.
 *
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-artists.ts
 */

type ArtistDoc = { uid: string; internalName: string; paragraphs: string[] };

const B2B_REUNION =
  "Blo je nekej v preteklosti, česar ni nihče videl prihajat, trenutek, ko sta Bobs pa MMali stala hrbet ob hrbtu, en trmast igralec proti drugmu, in z eno intenzivno skladbo za drugo prinesla konec nočnim zadevam. Čeprav si nihče ni upal napovedat, ali se bo zgodovina ponovila, jima ni vzelo dolgo, da sta spoznala, da je cajt, da se za pristne Endemit fane spet združita. Njuna glasba udari globoko — ne bo ti sam spremenila stanja uma na bolše, ampak bo za zmerm spremenila občutek grajske kleti.";

const ARTISTS: ArtistDoc[] = [
  {
    uid: "tonske",
    internalName: "Tonske",
    paragraphs: [
      "Tonske je selektor iz Velenja, poznan po natančnih, groove gnanih konstrukcijah, zgrajenih na minimalnih temeljih. Osredotoča se na flow, tesne prehode pa ogoljen nadzor. Je tut um za Cogo, še eno slovensko napredno založbo, posvečeno raziskovalni elektronski glasbi.",
    ],
  },
  {
    uid: "synatic-idium",
    internalName: "SYNATIC IDIUM",
    paragraphs: [
      "Synatic Idium je globok, hipnotičen signal Sandija Djulkića — rojenga v premogovni senci Šoštanjske doline, zdej oddaja iz Londona. Zvok oblikuje že od poznih devetdesetih in to se pozna: vsak kick, vsaka razpirajoča se zanka postavlena z natančnostjo nekoga, ki se je techna naučil, preden je razpadel na tisoč pod-oznak. Njegov je potrpežliv, hipnotičen deep techno — tisti, ki te potegne pod gladino, namest da bi te suval naokrog.",
      "Onkraj plošč je Sandi mentor v najbol pravem pomenu — brez njega ne bi blo Rhaegala. Njegovo obvladovanje produkcije deluje ko gravitacija, ki druge potegne v glasbo pa jih uči, pogosto ne da bi se trudil, kaj pomeni resno vzet obrt. Human Transducer, Nothing to Lose, Interzone — točke na dolgem loku, ki dokazuje, da nekateri umetniki ne lovijo trenutka, ampak ga preživijo.",
    ],
  },
  {
    uid: "seiichiro-itoyama",
    internalName: "Seiichiro Itoyama",
    paragraphs: [
      "Japonski umetnik s sedežem v Evropi, Seiichiro Itoyama deluje na robu sodobnga techna.",
      "Ko razisuje prostor med redukcijo pa intenzivnostjo, je razvil izrazit jezik, zgrajen na napetosti, gibanju pa zadržanosti.",
      "Ker daje prednost globini pred pretiravanjem, njegov zvok oblikuje tok linija ko instinkt.",
      "Zadržanost berlinskga zvoka poznih 2000-ih/zgodnjih 2010-ih pa neizprosna teža birminghamske tradicije se v njegovem delu združita, prelita skoz občutljivost, ki je povsem njegova — ostre/prefinjene produkcije, v katerih globina pa elegantnost delujeta ko struktura, ne ko okras.",
      "Naj bo v studiu ali za pultom, njegov zvočni jezik je tekoč — brez napora se giblje od teksturnga techna, broken-beat študij do prehodov melodične ambientalnosti — in ustvarja zvočni izraz, ki ostaja vitek v konstrukciji, a prostran v učinku, ter uravnoteži fizični udarec s prefinjeno eleganco.",
      "V dobi, ki pretiravanje pogosto zamenjuje za ambicijo, umetnik zasleduje obratno: inovacijo skoz redukcijo, silo skoz zadržanost.",
    ],
  },
  {
    uid: "dj-labrana",
    internalName: "DJ Labrana",
    paragraphs: [
      "Labrana je tista redka zvok zbirajoča zver, ki razume, da mora glasba nagovarjat um brez vsakih predsodkov. Pričakuj vzpodbuden dnevni izbor housa, disca pa leftfield posebnosti. Igriv, a globok, s ravno pravo mero nepredvidlivosti v vzorcu.",
    ],
  },
  {
    uid: "sim",
    internalName: "Sim",
    paragraphs: [
      "SIM se vrača s tretje izmene, kjer je izpilil novo gimnastiko zvokov, ki uteleša vse, kar povprečen človek leta 2390 še zmerm ne dojame. Da je lahk življenje tut lepo. Mišični spomin bo prinesel gibe iz podzavesti, iz cajtov, ko so njegovi prvi zvoki kosili zeleno travo libeliških polj.",
    ],
  },
  {
    uid: "rotte",
    internalName: "Rotte",
    paragraphs: [
      "Primorsko-koroška povezava se krepi z vsakim dnevom in zliva mediteransko svežino z vrhovi koroških gora. Rotte je glasnik novga primorskga vala drznih kuratorjev plesišča, ki v svoje stvaritve redno pakira neosvinčene atome underground zvokov.",
    ],
  },
  {
    uid: "kundi-institut",
    internalName: "Kundi Institut",
    paragraphs: [
      "Nekatere stvari preprosto niso iste. Naše praznovanje zagotovo ne bi blo isto brez Kundi Instituta. Oseba, globoko zaznamovana z močjo našga domačga koroškga okolja, ti bo pod noge vrgla 2390 brezhibnih ritmičnih ognjemetov.",
    ],
  },
  {
    uid: "mima-and-zazi",
    internalName: "Mima & Zazi",
    paragraphs: [
      "Mima & Zazi, neverjeten dvojec čudnih barv, glavni zvezdi našga funky odra nad zemljo, bosta nasmeh vrnili na prestrašene obraze, ki si vzamejo predah od Vinterjevih techno rjovenj spodej. Pripravi se na disco, house pa funk gibe, da vstopiš v novo leto brez poškodb kolkov.",
    ],
  },
  {
    uid: "pulso",
    internalName: "Pulso",
    paragraphs: [
      "Pulso opravla pot iz Argentine, da naši tradicionalni techno sceni predstavi edinstvene eksperimentalne, hipnotične pa analogne zvoke ter razburka psiho pa plesišče s svojimi loopastimi sci-fi miksi.",
      "\nJoelove produkcije so prepoznale velke založbe ko sta SRIE pa Semantica, ampak njegove veščine se nikakor ne ustavijo pri mešanju pa produkciji. Medtem ko dostavla svoje kvalitetne izdaje, Pulso sodeluje tut z založbo Histéresis, kjer masterira zvok pa oblikuje grafično gradivo za njihove digitalne pa kasetne izdaje. Njegova umetnost nadrealnih analognih kolažev zrcali njegov stil ko DJ-ja. Ne pričakuj nič manj ko nekej izven običajnga.",
    ],
  },
  {
    uid: "spati",
    internalName: "Špäti",
    paragraphs: [
      "Špäti, mati kadrovskih otrok, del cajta pometalka tal, del cajta umetnica, bo zaprla plesišče tete Pehte s house napoji pa drugimi skrivnimi sestavinami. Opisana ko popolnoma ekstatična, ima morda to, kar je treba, da preživi MMalijev underground nastop.",
    ],
  },
  {
    uid: "rhaegal",
    internalName: "Rhaegal",
    paragraphs: [
      "Rhaegal je ključni izvajalec na Endemit dogodkih pa kurator našga Emit podcasta, ki na svoji nenehno razvijajoči se poti ko umetnik nikol ne razočara svojih sledilcev. Njegovi seti so underground izkušnja prostranga čustvenga ozemlja, rudarska odprava v iskanju najglobjega pa najredkejšga materiala.",
      "Ko producent vodi založbo Hands of the Creator in posluščalcu deli roko onostranskih zvokov. Rhaegalov najnovejši LP je paleta zvokov v najtemnejših pa najčudnejših odtenkih, ki znova potrdijo njegov sloves dostavlavca surovga, eksperimentalnga techna.",
      "Že več ko desetletje oblikuje slovensko elektronsko sceno s svojimi brezkompromisnimi techno izbori in svoje nastope širi v evropske prestolnice.",
    ],
  },
  {
    uid: "inland",
    internalName: "Inland",
    paragraphs: [
      "Ed je britanski producent pa DJ s prebivališčem v Berlinu, kjer se njegov opus giblje med raziskovalnim technom pa ambient izdajami na njegovih založbah Counterchange in Globuli ter težjimi, bolj fizičnimi seti v Berghainu ali zgodnjih ponedelkovih sejah v Panorama Baru. Ustvarjalni pa duhovni brat po srcu MMaliju, je masteriral Issun-Bōshi EP in ga s svojim remixom še dodatno preoblikoval.",
    ],
  },
  {
    uid: "mmali-b2b-rhaegal",
    internalName: "MMali B2B Rhaegal",
    paragraphs: [B2B_REUNION],
  },
  {
    uid: "vinter-brothers-b2b",
    internalName: "Vinter brothers B2B",
    paragraphs: [B2B_REUNION],
  },
  {
    uid: "mirella-kroes",
    internalName: "Mirella Kroes",
    paragraphs: [
      "Mirella Kroes je skrit dragulj elektronske scene, ki se pojavi le, da deli posebne trenutke intimnosti — kvaliteta, ki jo globoko ceni pa z njo resonira. Strastna, a prizemljena duša, polna lubezni do narave, Mirella uteleša izrazito dvojnost, ki se zrcali v njenih DJ setih. Ker daje prednost globji, sodobni plati techna, njen izbor skladb niha med tem, da draži um pa očara dušo. Njeni seti se potopijo v trippy, bolj skrivnostne sfere elektronske glasbe in tkejo organske gradnje iz zvokov, da poudarijo vsak detajl. Vsak nastop je poglobljena izkušnja, tok sanjava kok prizemljena, ki na predanga posluščalca pusti trajen vtis in ga vabi, da se poda na to transcendentalno potovanje.",
    ],
  },
  {
    uid: "wata-igarashi",
    internalName: "Wata Igarashi",
    paragraphs: [
      "Wata Igarashi je eden najbol izrazitih pa spretnih producentov v svetu techna, pa vseeno njegovo spoštovanje do pristnih prizorišč pa iskrenga občinstva ostaja močno. Ker je izdal serijo EP-jev na založbah ko so Semantica, Midgar ali The Bunker NY, Watino ustvarjalno delo izstopa s tem, da žanru doda izrazit okus in združi hkrati energične pa sanjave kristalne strukture z globoko intenzivnostjo ter se potopi v psihedelične sfere techna.\n\nJaponci majo svoj lasten zvok — izrazit, globok pa nemogoče ga je ignorirat. Prvič, ko nam je padel v uho, smo vedli. To je blo to. Od tistga trenutka naprej smo vedli, da moramo ta zvok pripelat v Slovenijo, kadar je le mogoče, sam da se obdržimo na pravi poti.",
    ],
  },
  {
    uid: "unknown-texture",
    internalName: "Unknown Texture",
    paragraphs: [
      "Unknown Texture je še eno vzhajajočih slovenskih upov v technu — vseprisoten obraz na naših dogodkih, ki zdej končno stopa za pult. Poznan po globoki predanosti obrti, svoj zvok oblikuje skoz analogne pa modularne hipnotične ritme, globoke frekvence pa abstraktne teksture. Pravi digger pa raziskovalec zvoka, igra sam vinil — in pušča, da surovost voska vodi potovanje. Miha je pripravlen svojo strast prevest v set, ki odmeva daleč onkraj kletnih zidov.",
    ],
  },
  {
    uid: "mmali",
    internalName: "MMali",
    paragraphs: [
      "MMali – ki nastopa tut ko Issun-bōshi – trdno stoji za idejo, da je treba glasbo čutit, ne sam slišat.",
      "MMali je slovenski producent pa izvajalec s sedežem v Ljubljani, ki se je uveljavil ko eden najbol ustvarjalnih pa vsestranskih slovenskih underground DJ-jev. Zgradil si je ugled z nastopanjem pa kuriranjem dogodkov v Sloveniji, vključno z butičnim poletnim festivalom Izvir/Endemit. Že več ko desetletje oblikuje lokalno elektronsko sceno z vizionarskim pristopom k organizaciji dogodkov, ki ga je zasnovala Formaviva ekipa pa izpilil njegov novi kolektiv Endemit.",
      "V svoji produkciji pa setih se poda na progresivno pot, da preseže meje techna, in razisuje groovaste, melodične žanre – edinstven okus, ki ga je najbrž pridobil v glasbeni šoli, medtem ko je eksperimentiral v jazz bandu.",
      "Matejeva nedavna vinilna izdaja na založbi Endemit je njegov poklon globokmu, atmosferskmu, perkusivnmu technu. Vsebuje remix Inlanda pa obljublja prihodnje sodelovanje z drugimi Berghain rezidenti, ko je Efdemin.",
    ],
  },
  {
    uid: "rahul",
    internalName: "Rahul",
    paragraphs: [
      "Rahul, najmlajši član Endemit ekipe, je neutruden vzor predanosti naši skupni stvari. Njegovi seti zrcalijo njegove orientalske korenine; so živo potovanje tem, zvokov pa žanrov, odkritih na poti od Bakuja do Berlina. Rahulova druga vizionarska družina je RÆHAT, ekipa s slovenske obale, ki vodi razburlivo novo underground prizorišče.",
      "Njegova Endemit specialiteta je warm-up set, iskren stik z njegovim ustvarjalnim umom, ki posluščalca vabi, da deli globino pa strast, ki definirata vse, kar počne.",
    ],
  },
  {
    uid: "mozer",
    internalName: "Mozer",
    paragraphs: [
      "Mozer oblikuje zagrebško underground sceno že od leta 2000, ne sam ko umetnik, ampak tut ko kurator LOST/FOUND, ROAD! in UNFOLD. V zgodnjih letih pod vplivom industrial techna pa britanskih hard-groove zvokov je pozneje razvil izrazit stil in osvežil pristop k plastenju hipnotičnih vzorcev na minimalnih strukturah.  ",
      "Njegovi seti ustvarjajo edinstven flow, ki sproži globoko introspekcijo in občinstvo popele na čustveno potovanje.  ",
    ],
  },
  {
    uid: "mozer-b2b-beko",
    internalName: "Mozer B2B Beko",
    paragraphs: [
      "Beko prinaša okrepitve iz Zagreba in svojo izmenjavo globokih pa surovih groovov sooča z Mozerjevimi minimalnimi strukturami pa hipnotičnimi zvoki. Oba pionirja hrvaške underground scene kažeta tehnično spretnost pa čist fokus – Beko meša z izbrušenim progresivnim pridihom in Mozerju omogoča, da se pridruži s čustvenimi žanri, vključno z deep housom ali electrom.  ",
    ],
  },
  {
    uid: "material-object",
    internalName: "Material Object",
    paragraphs: [
      "Material Object je mojster zvočne arhitekture, ki gradi večdimenzionalno atmosfero abstraktnga techna, ambienta pa psihedeličnih komponent. Producent pa izvajalec, ki so ga sprejeli občinstva pa založbe po celem svetu, je svoj stil razvil skoz sodelovanja s sensejem elektronske glasbe Petetom Namlookom in svoj izrazit zvok prinesel na prizorišča ko sta Berghain ali festival Labyrinth. Po izvoru iz Avstralije zdej vzpostavla svoj novi hub v Sloveniji in debitira na Endemitu sredi koroškga gozda.",
    ],
  },
  {
    uid: "alan-backdrop",
    internalName: "Alan Backdrop",
    paragraphs: [
      "Alessio, naš sosed iz Padove, nas je navdušil s svojimi globoko čustvenimi pa melodičnimi produkcijami in svojo spretnostjo taljenja žanrov, ki gredo onkraj meja techna. Ko nenehno rastoč umetnik je od izdajanja glasbe na uglednih založbah prešel na izdajanje lastnih albumov, ki razisujejo vse med ambientom pa transom.  ",
      "Je pravi glasbenik, ki večino cajta preživi v svojem studiu, kjer eksperimentira s sintetizatorji, tko da uloviti njegov DJ nastop je redek blagoslov.  ",
    ],
  },
  {
    uid: "vermisst",
    internalName: "Vermisst",
    paragraphs: [
      "Vermisst je senčna uganka slovenske elektronske sfere, poznan po svojih globokih, atmosferskih produkcijah, ki razisujejo meje ambienta pa techna. Njegove izdaje na uglednih založbah ko je Hypnus razkazujejo prefinjen pristop k oblikovanju zvoka in združujejo hipnotične ritme s poglablajočimi teksturami. S subtilnim pa introspektivnim pristopom Vermisst vnaša red v kaos nepredstavlivih zvokov in se postavla ko edinstven glas underground elektronske scene. Njegovi live nastopi nosijo isto zadržano intenzivnost in občinstvu ponujajo meditativno, a močno izkušnjo.",
    ],
  },
  {
    uid: "isabel-soto",
    internalName: "Isabel Soto",
    paragraphs: [
      "Isabel je berlinska DJ-ka pa producentka iz Venezuele, ki je svoj surov, hipnotičen, perkusiven zvok razvila v Kanadi, kjer je eksperimentirala pa razisovala odprtost montrealske underground scene. Njena glasba je o združevanju abstraktnih tekstur pa globokih ritmov, da sproži občutke, ustvari edinstvene izkušnje pa zagon.  ",
      "S svojo lastno založbo NYXII Records pa svojim debitantskim EP-jem na Ostgut Ton Isabel počne stvari po svoje, organsko pa s srcem. Njen vzpon ni o hypu; je o eni skladbi, enem setu, eni noči naenkrat.  ",
    ],
  },
  {
    uid: "adriana-lopez",
    internalName: "Adriana Lopez",
    paragraphs: [
      "Pionirka zgodnje kolumbijske techno scene, Adriana Lopez si je zadnji dve desetletji gradila stalno prisotnost v Evropi. Njen surov, a globok, progresiven zvok, produciran pa mešan z inženirsko natančnostjo, je dosegel temne dvorane Berghaina pa Tresorja in osvojil založbe ko so Semantica, Artefacts pa Modularz. Njeni seti dajejo prednost flowu na plesišču; njen pristop v čist techno vnaša doslednost, spretnost pa predanost.",
    ],
  },
  {
    uid: "svarog",
    internalName: "Svarog",
    paragraphs: [
      "Oleksa je ukrajinski umetnik, ki je svoj prvotni projekt iz leta 2014 na novo definiral skoz izkušnje pa rast. Kar je blo nekoč zgrajeno na misticizmu, simbolizmu pa skonstruirani pripovedi, je prepustilo mesto naravnmu flowu zvoka v nedefiniranem prostoru — lebdenju med namenom pa inercijo, nadzorom pa predajo.  ",
      "Če izdaje na Semantica, Dynamic Reflection pa Affin orisujejo njegova zgodnja leta, ko je globino dosegal skoz koncept, je njegovo delo danes ogoljeno jedro prakse, ki ustvarja flow pa napetost med hipnotičnimi strukturami.",
      "Svarog ni več lik ali mitologija — je to, kar se je naučil delat najbolše, in potem ko smo bili priča njegovmu zgodnjmu projektu sredi koroškga gozda, imamo čast, da ga doživmo na novo.",
    ],
  },
  {
    uid: "obscur",
    internalName: "Obscur",
    paragraphs: [
      "Obscur si je v Sloveniji pa Evropi ustvaril ime ko DJ pa producent, posvečen technu v njegovi najčistejši obliki.",
      "Njegove produkcije so globoke, gnane pa subtilno psihedelične, vsaka skladba razkazuje njegovo neizprosno sledenje inovaciji. Njegova pozornost do detajlov je to, kar mu pomaga ustvarit zvok, ki zadene bistvo žanra in se zdi hkrati zrel pa prefinjen. Timovo doslednost, spretnosti pa zavezanost pristnosti so prepoznale ugledne založbe ko so Modularz, Paralelo, Newrhythmic pa Moving Pressure, pa tut underground prizorišča po celi Evropi.",
      "Ko DJ Obscur k vsakmu setu pristopa z isto mero natančnosti in skrbno gradi hkrati surov pa hipnotičen zvok, da ustvari napetost pa atmosfero.",
      "Naj bo v studiu ali za pultom, njegov fokus je jasen — pustit, da glasba govori sama zase.",
    ],
  },
  {
    uid: "beko",
    internalName: "Beko",
    paragraphs: [
      "Beko meša hipnotične groove s surovimi teksturami pa izbrušenim progresivnim pridihom. Njegovi seti, igrani izključno na vinilu, so sestavleni s potrpežljivostjo pa čistim fokusom in posluščalca vodijo skoz vzporedna stanja uma, ne da bi kdaj izgubil nit. Pravi mojster natančnga zagona.",
    ],
  },
  {
    uid: "jasa-buzinel",
    internalName: "Jaša Bužinel",
    paragraphs: [
      "Rezidenčni DJ na Channel Zero pa soustanovitelj kolektiva Cosmic Sex, Jaša ni sam umetnik, ampak tut glasbeni novinar, ki recenzira obetavne izdaje pa prikrite zvezde, pri čemer se zanaša na svoje izostreno uho pa bogat besednjak.  ",
      "Njegovi nastopi na Butiku, Mentu pa festivalu Libertas ga naredijo za naravno izbiro, da na naš Endemit dnevni oder prinese house, bas pa poletne vibe.",
    ],
  },
  {
    uid: "melaniflores",
    internalName: "melaniflores",
    paragraphs: [
      "Melani — ki nastopa ko melaniflores — je slovenska DJ-ka, ki si kleše svoj prostor v underground techno sceni. Njeni seti se gibljejo skoz hitre, hipnotične tokove: industrialni ritmi, naplasteni pod sintetičnimi teksturami, ki plesišče potegnejo v kolektiven trans.",
      "Njen odnos do glasbe seže globoko. Ko otrok je igrala klavir; pozneje je meditacija postala svoja oblika poslušanja. Ti prakse je nikol niso zapustile — sam spremenile so obliko in končno našle svojo najbol pristno obliko za pultom.",
      "Pandemija je postala nepričakovana prelomnica. Oropana zunanjga hrupa se je obrnila še bol navznoter in glasbo uporablala ko sidro pa raziskovanje hkrati. Leta 2022 je našla naraven dom pri Tryp, kolektivu, zakoreninjenem na slovenski obali, kjer se njen zvok še naprej razvija.",
    ],
  },
  {
    uid: "conceptual",
    internalName: "Conceptual",
    paragraphs: [
      "Conceptual je Poncij Pilat plemena, križar, ki nas bo med glavnimi urami obsodil na grajske dvorane. Simone je izdelal glasbeni stil, zasnovan tko, da odklopi tvoj obremenjen um pa osvobodi tvoje telo teže znorelga sveta.  ",
      "Rojen v zibelki Rimskga imperija, je vstal od mrtvih v Berlinu, kjer je ustanovil Friendship Collective pa založbo DUNA. Njegove izdaje na Illegal Alien pa Semantica Records skupej z njegovim progresivnim pristopom k DJ-anju razkazujejo njegovo predanost deep technu pa eksperimentiranju.  ",
    ],
  },
  {
    uid: "vinter",
    internalName: "Vinter",
    paragraphs: [
      "Vinterjev zvok zaznamuje njegova uporaba kontrasta — uravnoteženje med zadržanostjo pa sprostitvijo, pri čemer zadržanost v njegovem (mind)setu nikol ni prava opcija. Njegov glasbeni okus je oster, pa vseeno nekak čustven, njegovi izbori z natančnostjo pa slogom v kamen postavlajo meje techna. Je zaupanja vredna prisotnost, da atmosfero potisne do skrajnosti tik pred glavno točko.",
    ],
  },
  {
    uid: "amanda-mussi",
    internalName: "Amanda Mussi",
    paragraphs: [
      "Amanda Mussi je brazilsko-paragvajska DJ-ka, producentka pa vodja založbe in agencije, poznana po svojem delu v techno pa house sceni. Je gonilna sila južnoameriškga undergrounda, izdaja glasbo na raznih založbah ter vodi booking agencijo .alt bookings pa založbo Macro Hits. Mussi ima sedež v Berlinu, a ohranja globoke povezave z Južno Ameriko in nastopa po celem svetu.",
    ],
  },
  {
    uid: "variable",
    internalName: "Variable",
    paragraphs: [
      "Ko vznika iz slovenskga undergrounda, je Variable umetnik, ki deluje v temnejših, bolj cerebralnih spektrih techna. Njegov pristop k nastopu je študija dvojnosti: premošča otiplivo toplino vinila z natančnostjo sodobnih digitalnih orodij. Ta hibridna metodologija mu omogoča, da gradi sete, ki se zdijo hkrati brezčasni pa eksperimentalni.",
      "Zvočno Variable daje prednost surovmu pa hipnotičnmu. Njegovi nastopi so poznani po svojih globokih, poglablajočih atmosferah, prekinjenih z abstraktnimi teksturami pa razmajanimi ritmi, ki izzivajo plesišče.",
    ],
  },
  {
    uid: "dvidevat",
    internalName: "dvidevat",
    paragraphs: [
      "Nekatere enačbe je težko rešit, druge so preproste. Združitev dvidevat pa njenih energičnih talentov čez širok spekter elektronske glasbe z Endemit občinstvom je preprosta enačba. Zgodila se bo poroka v nebesih.",
    ],
  },
  {
    uid: "tamorra",
    internalName: "Tamorra",
    paragraphs: [
      "Človek vpija okolje ali pa okolje vpija človeka. Naslednji vodja je produkt slovenske Istre pa endemitskih bojnih vrst, ki je svoje talente osebno pa intenzivno vložil v obe pokrajini. S primorskimi fanatiki jim je v samo nekaj letih uspelo iz suhe, zapuščene ravnine sestavit par ducatov puščavskih krožnikov novga primorskga techno ekosistema.",
      "Tamorra je skoz preučevanje terenov na prejšnjih endemitskih snidenjih v sebi prebudil prvinske instinkte usodne privlačnosti. Med njim pa nami, med glasbo pa umom, med intimnim ritualom pa osvoboditvijo od omejitev zgodnje odraslosti. Če bi ta film snemali danes, bi bil Matija eden glavnih razlogov za disco. Cajt je, da svoj kos položi na našo mizo.",
    ],
  },
  {
    uid: "psyk",
    internalName: "psyk",
    paragraphs: [
      "psyk je ime svoje generacije pa eno največjih imen naše kulture. Svoj pečat je pustil na vseh najpomembnejših dogodkih pa v klubih, ključnih stebrih techno kulture po celem svetu. Španska tradicija odličnosti se nadaljuje.",
    ],
  },
  {
    uid: "madalba",
    internalName: "Madalba",
    paragraphs: [
      "Kulture sveta se združijo v čudoviti Madalbi. Ker je v svojem življenju prepotovala svet, je le naravno, da bo tokrat z nami v skritem draguju, prikritem očem celga vesolja. S sabo prinaša nepogrešljiv del berlinske kulture, ki se brezhibno prilega našim prizadevanjem.",
    ],
  },
  {
    uid: "meelo",
    internalName: "Meelo",
    paragraphs: [
      "Frontman ansambla re_lined je garancija za dozo dobro izdelane glasbe. Njegova vera v glasbo odpira vrata natančnosti pa popolnosti njegovih kompozicij. Njegov nastop te bo držal v zelo visoki energiji.",
    ],
  },
  {
    uid: "omnia-vox",
    internalName: "Omnia Vox",
    paragraphs: [
      "Omnia Vox je kipar zvočnih pokrajin, ki dihajo pa z lahkoto in naravnim flowom preusmerjajo pozornost na naslednjo postajo neraziskanga. Z uporabo ambienta, drona pa organskih posnetkov so njegovi seti nujno potrebna dekompresija — platforma za razmislek pa reset.",
    ],
  },
  {
    uid: "beste-hira",
    internalName: "Beste Hira",
    paragraphs: [
      "Beste Hira prinaša neustrašen pristop k dvigovanju plesišča in kot mirovno daritev ponuja gosto perkusijo, abstraktne melodije pa privlačne ritme, da izvede visokoenergijski zvočni ritual. Pričakuj intenziven, obliko spreminjajoč set, ki nikol ne neha slediti svoji lastni pripovedi.",
    ],
  },
  {
    uid: "pvtr",
    internalName: "Pvtr",
    paragraphs: [
      "Pvtr je začrtal načrt za prepletanje ambient techna z dub vplivi pa meditativnimi ritmi, kar spodbuja globoko interakcijo med prostornimi, a subtilnimi zvočnimi strukturami. Njegovo postopno potaplanje v prostranost neznanga vabi k mirovanju pa fokusu ter z veliko vnemo pa namenom razisuje prostor med zvokom. Pričakuj premišleno potovanje v globine techna.",
    ],
  },
  {
    uid: "kathron",
    internalName: "Kathron",
    paragraphs: [
      "Kathron nam je večkrat padla v uho, njeni vsestranski nastopi so se sešteli v njeno že zdavnej zaslužno Endemit rekrutacijo. Poznana po svojih Clockwork Voltage live nastopih pa DJ sejah na lokalnih underground prizoriščih, je začela gostit tut glasbeno oddajo Flash Forward na Radiu Študent, kjer je njihov program alternativne glasbe prej podpirala ko tonska tehnica.  ",
      "Katjin prvi Endemit warm-up debi bo surov, a čustven prikaz njenih veščin glasbenga inženiringa, njene lubezni do modularnih sintetizatorjev pa založb ko so Token, Blue Print ali Illegal Alien Records.",
    ],
  },
  {
    uid: "rene-wise",
    internalName: "Rene Wise",
    paragraphs: [
      "Rene Wise dostavla močan, perkusiven techno, da razgiba gibanje. Njegov značilni zvok je prizemljen pa gnan — surov, a moderen ritem, pognan v gibanje, da ustvari atmosferske zvočne pokrajine, kjer se telo pa zvok združita. Nikol vsiljiv, zmerm natančen pa pod nadzorom. Kurira imprint Moving Pressure, založbo, ki zrcali njegovo zvočno estetiko: ogoljen, groove težak techno, ki izhaja iz perkusivnga ozadja. Obscurjeva nedavna izdaja na založbi povezuje našo sceno z Renejevo skoz skupno zvočno etiko — tesno, surovo pa globoko občuteno.",
    ],
  },
  {
    uid: "mokilok",
    internalName: "Mokilok",
    paragraphs: [
      "Mokilok, naš ljubljeni festivalski rezident, se vrača — tokrat za svoj dolgo pričakovan debi v grajski kleti. Do zdej so njegovi seti zmerm odmevali pod odprtim nebom, ampak zdej njegov zvok prinašamo v notranjost, kjer bojo kamniti zidovi ujeli pritisk. Pričakuj cajt upogibajoč spopad: klasičen techno devetdesetih pa umazan hard house se soočita s temnejšim, modernim robom. Nazaj v prihodnost — pod obokanimi stropi.",
    ],
  },
];

async function migrateArtist(client: ReturnType<typeof createClient>, a: ArtistDoc) {
  const doc = await client.getByUID("artist" as never, a.uid);
  const data = (doc as { data: Record<string, unknown> }).data;
  const source = (data.description as { type: string; text: string }[]) ?? [];

  let ti = 0;
  data.description_sl = source.map(b => {
    if (b.text && b.text.trim()) {
      const t = a.paragraphs[ti++];
      return { type: b.type, text: t ?? b.text, spans: [] };
    }
    return b;
  });
  if (ti !== a.paragraphs.length)
    console.warn(`  ⚠ ${a.uid}: used ${ti}/${a.paragraphs.length} translations`);

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, a.internalName);
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ ${a.uid}`);
}

async function main() {
  const client = createClient();
  console.log(`Artists (${ARTISTS.length}):`);
  for (const a of ARTISTS) await migrateArtist(client, a);
  console.log(`\nArtists done (${ARTISTS.length}).`);
}

main().catch(err => {
  console.error("Artists migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
