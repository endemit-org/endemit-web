/**
 * Festival 2027 editorial copy. Source: the client's "Festival 2027" text
 * (EN + Koroščina). Kept in code until the practical pages move to Prismic.
 */
export type FestivalLocale = "sl" | "en";

type Block = { title: string; paragraphs: string[]; note?: string };

export type FestivalCopy = {
  dateline: string;
  place: string;
  year: string;
  tagline: string;
  cta: string;
  scroll: string;
  aboutTitle: string;
  about: string[];
  motto: string[];
  filmTitle: string;
  filmCta: string;
  filmClose: string;
  vibeTitle: string;
  lineupTitle: string;
  lineup: string;
  lineupSoon: string;
  timelineTitle: string;
  timelineNow: string;
  timelineDone: string;
  ticketsTitle: string;
  ticketsIntro: string;
  mapTitle: string;
  mapIntro: string;
  mapNote: string;
  mapOpen: string;
  mapClose: string;
  infoTitle: string;
  infoMore: string;
  stay: Block[];
  food: Block[];
  codex: Block;
  wallet: Block;
  walletLink: string;
  location: Block;
  storiesTitle: string;
  newsletterTitle: string;
  navLabel: string;
  home: string;
  allEvents: string;
  nightWord: string;
  nightSub: [string, string];
  galleryAll: string;
  galleryClose: string;
  galleryPrevious: string;
  galleryNext: string;
  nav: { id: string; label: string }[];
  newsletterText: string;
  soundOn: string;
  soundOff: string;
  back: string;
  marquee: string[];
};

export const festivalCopy: Record<FestivalLocale, FestivalCopy> = {
  en: {
    dateline: "August 13–15",
    place: "Libeliče, Slovenia",
    year: "2027",
    tagline: "The annual Assumption of the Tribe",
    cta: "Get tickets",
    scroll: "Descend",
    aboutTitle: "Don't forget to go home",
    about: [
      "The annual Asumption of the Tribe is a gathering our founding Carinthian fathers held over a decade ago, in Libeliče, by the Drava River. The vast mass which cuts deep into the old forests, created an unforgiving terrain that has shaped us and made us act on a hardwired impulse to keep returning back home.",
      "We grew up with this place as much as it grew up with us, and the flow we've created along the way grows stronger each year.",
      "Here, we move with full assertiveness amid the wilderness we tamed with the precision of sound and the thoroughness of experience. Here the music lines up perfectly in tune with the setting and state of our mind. This is our sanctuary, this is where we disconnect from the world and restore our feeling of belonging.",
    ],
    motto: ["Join the family.", "Don't forget to go home."],
    filmTitle: "Moments from 2026",
    filmCta: "Watch the film",
    filmClose: "Close film",
    vibeTitle: "Three days by the river",
    lineupTitle: "Line up",
    lineupSoon: "Revealing soon",
    lineup: "Endemit artists, guest artists to be announced soon",
    timelineTitle: "Ticket releases",
    timelineNow: "On sale now",
    timelineDone: "Sold out",
    ticketsTitle: "Tickets",
    ticketsIntro: "Blind tickets. No line up yet, just the place, the sound and the family. The more of you come together, the less each one pays.",
    mapTitle: "The grounds",
    mapIntro: "The map with a timetable is put up at the festival grounds, so you can enjoy the experience offline.",
    mapNote: "This map is from last year. This year's comes out in the month before the festival.",
    mapOpen: "Open the map",
    mapClose: "Close the map",
    infoTitle: "Good to know",
    infoMore: "All practical info",
    stay: [
      {
        title: "Camping",
        paragraphs: [
          "The festival is best experienced in a community setting. Camp is located within the festival grounds, free of charge for all festival ticket holders.",
        ],
        note: "Limited number of tents can be rented for an additional fee. You can check the availability and add this service to your cart when purchasing the ticket.",
      },
      {
        title: "Hotel & apartments",
        paragraphs: [
          "Hotel accommodation is available in limited capacities at Hotel Korošica ★★★★. If you hurry, you may also find an apartment nearby on Google, Booking or other sites.",
        ],
      },
      {
        title: "Camper vans",
        paragraphs: [
          "If you're staying with a camper van, there are 6 municipality spots available at the entrance to the festival grounds with utility connectors for a nominal fee.",
        ],
      },
    ],
    food: [
      {
        title: "Food",
        paragraphs: [
          "All meals are prepared locally at the venue by our hosts, the Sajevec family. The menu is based on the Carinthian fusion cuisine, featuring traditional dishes made of local products with a modern twist. It covers the nutritional range of both omnivores and vegans.",
          "All food can be purchased solely by using the digital Wallet.",
        ],
      },
      {
        title: "Drinks",
        paragraphs: [
          "The main bar next to the food court and merch stand runs at all hours. It's where you can always get cooled drinks or coffee and a protein refreshment during the day. An additional bar by the main stage is run at night to keep all bodies and souls run on fresh, spirited, or light drinks. Kristjan and his tireless bartender team are an indispensable part of our Endemit family, so we ask you treat them as you'd treat your best friend.",
          "All drinks can be purchased solely by using the digital Wallet.",
        ],
      },
    ],
    codex: {
      title: "Practical info",
      paragraphs: [
        "The map with a timetable is put up at the festival grounds, so you can enjoy the experience offline.",
        "The campground location is non-negotiable, as we need to preserve the sports ground and keep away from the riverbed. Arrive soon and secure a spot in shade. For those who will stay up all night and try to get some sleep during the day, there is a chill area where you can get some rest beneath the trees.",
        "The number of parking and campervan spots is approximately the same as the number of people fit to drive on a Sunday afternoon. Car sharing is thus double-caring for nature and other Sunday drivers.",
        "Clean toilets and hot showers are located at the entrance – should you choose nature, make sure not to desecrate our venue or tents. There is enough water to clean all souls who shall not seek life purpose under the faucet. We still prefer to call firemen for water supply than to have them search for drowned Robinsons. The Drava River is off-limits.",
      ],
    },
    wallet: {
      title: "Wallet",
      paragraphs: [
        "To make everything easy and smooth, we have set up our own cashless payment system, which powers all payments at the festival.",
      ],
    },
    walletLink: "Read more about the Wallet",
    location: {
      title: "Location",
      paragraphs: [
        "Our festival ground sits in Libeliče, a place on the Slovenian-Austrian border, where the Drava River runs past meadows and old Carinthian forests. Nature does most of the work for us, while we bring the best sound that shakes up the valley each August.",
      ],
    },
    storiesTitle: "Whispers from the valley",
    newsletterTitle: "Stay in the loop",
    navLabel: "Sections",
    home: "Endemit",
    allEvents: "All Endemit events",
    nightWord: "Two nights. Sleep by day.",
    nightSub: ["Every ticket includes a camping spot.", "Bring your own tent or rent one from us."],
    galleryAll: "All photos",
    galleryClose: "Close",
    galleryPrevious: "Previous photo",
    galleryNext: "Next photo",
    nav: [
      { id: "about", label: "About" },
      { id: "impressions", label: "Moments" },
      { id: "lineup", label: "Line up" },
      { id: "tickets", label: "Tickets" },
      { id: "map", label: "Map" },
      { id: "info", label: "Info" },
    ],
    newsletterText: "Line up, ticket batches and stories from the valley, straight to your inbox.",
    soundOn: "Sound on",
    soundOff: "Sound off",
    back: "Back to the festival",
    marquee: ["Don't forget to go home", "Libeliče", "August 13–15 2027", "Join the family"],
  },
  sl: {
    dateline: "13–15 avgust",
    place: "Libeliče",
    year: "2027",
    tagline: "Tradicionalni vnebohod endemitskega plemena",
    cta: "Po karte",
    scroll: "Sposti se",
    aboutTitle: "Ne pozabi jt domo",
    about: [
      "Tradicionalni vnebohod endemitskega plemena je srečanje, kero je pognavo korenine pred več ko desetletjem, ko so se koroške starešine prvič naselile v Libeličah. Ob Dravi, kera je zasekava v jedro pradavnih drv in ustvarva teren, ko nam je vbiv koroško trmo v bučo in nam privzgojiv impulz, da se zmerm vračamo domo.",
      "S ttim placom smo gr zrasli tko pa je on zrasto z nami. Tole je tok, ko smo ga pognali po dolini, vsako leto močnejši in zmerm bol teče po špuri, ko smo jo nastajli s kalibracijo zvoka in globino samorastniške izkušne.",
    ],
    motto: ["Ne postit familije zadi.", "Ne pozabi jt domo."],
    filmTitle: "Utrinki iz 2026",
    filmCta: "Pogli film",
    filmClose: "Zapri film",
    vibeTitle: "Tri dni ob Dravi",
    lineupTitle: "Line up",
    lineupSoon: "Razkrijemo kmalo",
    lineup: "Artisti endemitskega plemena, kundije s tujine napovemo kmalo",
    timelineTitle: "Runde kart",
    timelineNow: "Zj na volo",
    timelineDone: "Razprodano",
    ticketsTitle: "Karte",
    ticketsIntro: "Karte na slepo. Line upa še ni, sam plac, zvok pa familija. Več ko vas pride skop, mn plača vsak.",
    mapTitle: "Plac",
    mapIntro: "Mapa z urnikom bo obešena v vidnem poljo, zato ne rabiš skoz gledat v telefon.",
    mapNote: "Tale mapa je od lani. Letošna pride v meseco pred festivalom.",
    mapOpen: "Ofni mapo",
    mapClose: "Zapri mapo",
    infoTitle: "Dobro je vedet",
    infoMore: "Vse praktične info",
    stay: [
      {
        title: "Kampiranje",
        paragraphs: [
          "Festival se najlepš doživi skop s kolegi med plemenom, s šotorom na travniko, kerga lahko zaston vržejo vsi s festivalsko karto.",
        ],
        note: "Rentaš si lahko tut endemitski šotor za doplačilo. Število je omejeno, zato ne predovgo študerat, a si ga boš dodav v košarico.",
      },
      {
        title: "Hoteli in apartmaji",
        paragraphs: [
          "Hotelska nastanitev je na volo v Hotelo Korošica. Če pohilaš, najdeš morda tut kak apartma v bližini.",
        ],
      },
      {
        title: "Avtodomi",
        paragraphs: [
          "Če se prpeleš z avtodomom al pa kombijom, je na parkiriščo na volo 6 občinskih mest s prklopom na komunalo za simbolično ceno.",
        ],
      },
    ],
    food: [
      {
        title: "Hrana",
        paragraphs: [
          "Vse obroke prpravla na placo familija Sajevec. Meni predstavla koroško fuzijo tradicionalno-modernih jedi iz lokalnih frišnih sestavin, ki pokrijejo prehranjevalne navade vseh, tut veganov.",
          "Vso hrano na menijo lahko nabavlaš izključno z digitalno Denarnco.",
        ],
      },
      {
        title: "Pijača",
        paragraphs: [
          "Taglavni bar med štantom s hrano in merchom je ofnan 24/7. Tam lahko zmerm dobiš hladn drink, čez dan pa tut kavo in proteinske okrepitve. Dodatn bar se ofne pred glavnim plesiščom, tk da v ključnem momento nobenmo duho in teleso ne zmanka šarf al pa nežnih napitkov. Kristjan je s svojo ekipo nepogrešljiv dev endemitske familije, tk da jih mej tko svoje najbolše prjatle.",
          "Pijačo lahko nabavlaš izključno z digitalno Denarnco.",
        ],
      },
    ],
    codex: {
      title: "Kodeks",
      paragraphs: [
        "Mapa z urnikom bo obešena v vidnem poljo, zato ne rabiš skoz gledat v telefon.",
        "O lokaciji šotorišča se ne pogaja, kr mormo prhranit trpleje športni zelenici in držat varnostni pas ob reki. Ker prvi pride, prvi zacahna senco. Tsti, ki jo zamudijo, pa majo čez dan povno sence na chill placo pod drevesi.",
        "Parkingov je vsako leto isto, tko je približno isto število ldi, ki so v nedelo dojst frišni za volanom. Car sharing je najbolši caring – ne sam za naravo, ampak tut za varnost drugih v prometo.",
        "Odvaja in umiva se sam na wcjo in tuš kabinah pr vhodo, če greš prvinsko v naravo, pa jdi mavo bol globoko v njo, ne pa gr po šotoro. Vode bo v ključnih momentih zadojst, če nevš isko smisla lajfa pod tušom. Sicr pa mamo rajš intervencije z gasilsko cisterno ko pa robinzone v Dravi.",
      ],
    },
    wallet: {
      title: "Denarnca",
      paragraphs: [
        "Da bo vse teklo hitr pa fajn, mamo svoj brezkešn sistem, ki poganja vsa plačila na festivalu.",
      ],
    },
    walletLink: "Prebri si več o denarnci",
    location: {
      title: "Plac",
      paragraphs: [
        "Naš plac leži v Libeličah, blizo slovensko-avstrijske meje, kjer Drava teče mimo travnikov in stare koroške šume. Narava tole opraji glavno delo — mi prnesemo sam lučke, dekoracijo in zvok, ki vsako leto avgusta strese dolino.",
      ],
    },
    storiesTitle: "Šepeti iz doline",
    newsletterTitle: "Stisni se co",
    navLabel: "Sekcije",
    home: "Endemit",
    allEvents: "Vsi Endemit eventi",
    nightWord: "Dve noči. Spanje podnev.",
    nightSub: ["Plac za kampiranje je v vsaki karti.", "Šotor prneseš sam al pa ga najameš pr nas."],
    galleryAll: "Vse slike",
    galleryClose: "Zapri",
    galleryPrevious: "Prejšna slika",
    galleryNext: "Nasledna slika",
    nav: [
      { id: "about", label: "Zgodba" },
      { id: "impressions", label: "Utrinki" },
      { id: "lineup", label: "Line up" },
      { id: "tickets", label: "Karte" },
      { id: "map", label: "Plac" },
      { id: "info", label: "Info" },
    ],
    newsletterText: "Line up, runde kart pa zgodbe iz doline, naravnost v tvoj nabiralnik.",
    soundOn: "Zvok ofnan",
    soundOff: "Zvok ugasnen",
    back: "Nazaj na festival",
    marquee: ["Ne pozabi jt domo", "Libeliče", "13–15 avgust 2027", "Ne postit familije zadi"],
  },
};
