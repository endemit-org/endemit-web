import "dotenv/config";
import * as prismic from "@prismicio/client";
import { readFileSync } from "node:fs";

/**
 * Creates the Endemit festival 2027 event and its products as DRAFTS in a
 * Prismic migration release (nothing is published by this script).
 *
 *   npx tsx scripts/prismic-create-festival-2027.ts
 *
 * Based on endemit-festival-2026 (venue, attributes, hero slice shape).
 * Values marked TEMP are placeholders agreed to be corrected in Prismic.
 */
const REPO = process.env.PRISMIC_REPOSITORY_NAME || "endemit";
const GRAPHICS = "festival-vib-graphics";
const EVENT_UID = "endemit-festival-2027";

type Block = { type: string; text: string; spans: never[] };
const rt = (text: string, type = "paragraph"): Block[] =>
  text.split("\n").map(t => ({ type, text: t, spans: [] }));

const ABOUT_EN =
  "The annual Asumption of the Tribe is a gathering our founding Carinthian fathers held over a decade ago, in Libeliče, by the Drava River. The vast mass which cuts deep into the old forests, created an unforgiving terrain that has shaped us and made us act on a hardwired impulse to keep returning back home.\n" +
  "We grew up with this place as much as it grew up with us, and the flow we've created along the way grows stronger each year.\n" +
  "Here, we move with full assertiveness amid the wilderness we tamed with the precision of sound and the thoroughness of experience. Here the music lines up perfectly in tune with the setting and state of our mind. This is our sanctuary, this is where we disconnect from the world and restore our feeling of belonging.\n" +
  "Join the family. Don't forget to go home.";

const ABOUT_SL =
  "Tradicionalni vnebohod endemitskega plemena je srečanje, kero je pognavo korenine pred več ko desetletjem, ko so se koroške starešine prvič naselile v Libeličah. Ob Dravi, kera je zasekava v jedro pradavnih drv in ustvarva teren, ko nam je vbiv koroško trmo v bučo in nam privzgojiv impulz, da se zmerm vračamo domo.\n" +
  "S ttim placom smo gr zrasli tko pa je on zrasto z nami. Tole je tok, ko smo ga pognali po dolini, vsako leto močnejši in zmerm bol teče po špuri, ko smo jo nastajli s kalibracijo zvoka in globino samorastniške izkušne.\n" +
  "Ne postit familije zadi. Ne pozabi jt domo.";

// Batch dates are placeholders; weekend prices are confirmed. Prices are in cents.
const PRICE_BATCHES = [
  ["Blind tickets", "Karte na slepo", "No line up yet. Duo 160, Group 300, one evening 55", "Brez line upa. Duo 160, Skupinska 300, en večer 55", 8500, "2026-11-22T23:00:00+0000", "2027-01-31T22:59:00+0000"],
  ["First batch", "Prva runda", "Duo 180, Group 340, one evening 60", "Duo 180, Skupinska 340, en večer 60", 9500, "2027-01-31T23:00:00+0000", "2027-04-30T21:59:00+0000"],
  ["Second batch", "Druga runda", "Duo 200, Group 380, one evening 65", "Duo 200, Skupinska 380, en večer 65", 10500, "2027-04-30T22:00:00+0000", "2027-07-31T21:59:00+0000"],
  ["Last batch", "Zadna runda", "Duo 220, Group 420, one evening 70", "Duo 220, Skupinska 420, en večer 70", 11500, "2027-07-31T22:00:00+0000", "2027-08-15T15:00:00+0000"],
] as const;

async function main() {
  const client = prismic.createWriteClient(REPO, {
    writeToken: process.env.PRISMIC_WRITE_TOKEN!,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  const existing = await client
    .getByUID("event" as never, EVENT_UID)
    .catch(() => null);
  // A published event is fine once its id is known: later runs update it or add products to it.
  if (existing && !process.env.FESTIVAL_EVENT_DRAFT_ID) throw new Error(`${EVENT_UID} already exists, aborting`);
  // Set when the event draft already exists (a first run created it empty).
  const eventDraftId = process.env.FESTIVAL_EVENT_DRAFT_ID;

  const prev = await client.getByUID("event" as never, "endemit-festival-2026");
  const prevData = prev.data as Record<string, unknown>;
  const prevHero = (prevData.slices as { slice_type: string; primary: Record<string, unknown> }[]).find(
    s => s.slice_type === "hero"
  )!;
  // Products are written in the repository's master language, like the event.
  const sampleTicket = { lang: prev.lang };

  // FESTIVAL_ONLY: event | products | day (day = only the two single-evening tickets).
  const only = process.env.FESTIVAL_ONLY;
  const skipEvent = only === "products" || only === "day" || only === "topups";
  const migration = prismic.createMigration();
  const eventAsset = (file: string) =>
    skipEvent ? undefined : migration.createAsset(new File([readFileSync(`${GRAPHICS}/${file}`)], file), file);
  const cover = eventAsset("festival_2027_wide_with_text.png");
  const coverNoText = eventAsset("festival_2027_wide_no_text.png");
  const square = migration.createAsset(
    new File([readFileSync(`${GRAPHICS}/festival_2027_square.png`)], "festival_2027_square.png"),
    "festival_2027_square.png"
  );


  const eventDoc = {
      type: "event",
      uid: EVENT_UID,
      lang: prev.lang,
      tags: [],
      data: {
        title: "Endemit festival '27",
        description: rt(ABOUT_EN),
        description_sl: rt(ABOUT_SL),
        cover_image: cover,
        promo_image: square,
        venue: prevData.venue,
        date_start: "2027-08-13T13:00:00+0000",
        date_end: "2027-08-15T15:00:00+0000",
        artists: [],
        event_type: "Festival",
        // Hidden until launch; flip to Visible in Prismic.
        visibility: "Hidden",
        enable_link_to_full_page: true,
        allow_ticket_scanning: false,
        show_artist_times: true,
        hide_lineup: true,
        hide_lineup_section: true,
        free_admission: false,
        incognito: false,
        has_cashless_payments: true,
        cash_ticket_price: 120, // TEMP: copied from 2026
        ticket_goal: prevData.ticket_goal,
        slices: [
          {
            slice_type: "hero",
            variation: "default",
            version: "initial",
            items: [],
            primary: {
              heading: rt("August 13th - 15th", "heading1"),
              heading_sl: rt("Avgust 13 - 15", "heading1"),
              description: prevHero.primary.description,
              description_sl: prevHero.primary.description_sl,
              backgroundImage: coverNoText,
              overlayOpacity: 30,
            },
          },
          {
            slice_type: "poem",
            variation: "default",
            version: "initial",
            items: [],
            primary: { content: rt(ABOUT_EN), content_sl: rt(ABOUT_SL) },
          },
          {
            slice_type: "ticket_price_progress",
            variation: "default",
            version: "initial",
            primary: {
              heading: "Ticket releases",
              heading_sl: "Runde kart",
              subheading: "Blind tickets on sale now. Prices rise with every batch.",
              subheading_sl: "Karte na slepo so na volo. Z vsako rundo so dražje.",
            },
            items: PRICE_BATCHES.map(([title, title_sl, description, description_sl, price, from, until]) => ({
              title,
              title_sl,
              description,
              description_sl,
              price,
              available_from: from,
              available_until: until,
              is_visible: true,
            })),
          },
        ],
      } as never,
  };
  const event = skipEvent
    ? null
    : eventDraftId
    ? migration.updateDocument({ ...eventDoc, id: eventDraftId } as never, "Endemit festival '27")
    : migration.createDocument(eventDoc as never, "Endemit festival '27");
  const eventLink = eventDraftId ? { link_type: "Document", id: eventDraftId } : event;

  type ProductInput = {
    uid: string;
    title: string;
    title_sl: string;
    description: string;
    description_sl: string;
    notice?: [string, string];
    checkout: [string, string];
    category: "Tickets" | "Other";
    price: number;
    ticketQuantity?: number;
    cutoff?: string;
    template?: "festival" | "festival-evening";
    sorting: number;
  };

  const products: ProductInput[] = [
    {
      uid: "endemit-festival-2027-single-ticket",
      title: "Festival '27 single ticket",
      title_sl: "Festival '27 karta",
      description: "Entry for one person to Endemit festival, Libeliče, August 13th to 15th 2027. Camping is included.",
      description_sl: "Vstop za eno osebo na Endemit festival, Libeliče, 13. do 15. avgust 2027. Kamp je vključen.",
      notice: ["Blind ticket, line up to be announced", "Karta na slepo, line up napovemo kmalo"],
      checkout: ["Single ticket for Endemit festival '27", "Karta za Endemit festival '27"],
      category: "Tickets",
      price: 85, // blind batch
      ticketQuantity: 1,
      template: "festival",
      sorting: 930,
    },
    {
      uid: "endemit-festival-2027-duo-ticket",
      title: "Festival '27 duo ticket",
      title_sl: "Festival '27 duo",
      description: "Entry for two people to Endemit festival, Libeliče, August 13th to 15th 2027. Camping is included.",
      description_sl: "Vstop za dve osebi na Endemit festival, Libeliče, 13. do 15. avgust 2027. Kamp je vključen.",
      notice: ["Two tickets, blind sale", "Dve karti, na slepo"],
      checkout: ["Duo ticket for Endemit festival '27", "Duo karta za Endemit festival '27"],
      category: "Tickets",
      price: 160, // blind batch
      ticketQuantity: 2,
      template: "festival",
      sorting: 920,
    },
    {
      uid: "endemit-festival-2027-group-ticket",
      title: "Festival '27 group ticket",
      title_sl: "Festival '27 skupinska",
      description: "Entry for four people to Endemit festival, Libeliče, August 13th to 15th 2027. Camping is included.",
      description_sl: "Vstop za štiri osebe na Endemit festival, Libeliče, 13. do 15. avgust 2027. Kamp je vključen.",
      notice: ["Four tickets, blind sale", "Štiri karte, na slepo"],
      checkout: ["Group ticket for Endemit festival '27", "Skupinska karta za Endemit festival '27"],
      category: "Tickets",
      price: 300, // blind batch
      ticketQuantity: 4,
      template: "festival",
      sorting: 910,
    },
    {
      uid: "endemit-festival-2027-evening-ticket",
      title: "Festival '27 one evening ticket",
      title_sl: "Festival '27 en večer",
      description: "One entry for one person to Endemit festival, Libeliče, on Friday August 13th or Saturday August 14th 2027. The holder picks the evening on the day.",
      description_sl: "En vstop za eno osebo na Endemit festival, Libeliče, v petek, 13., al soboto, 14. avgusta 2027. Večer zbereš na dan.",
      notice: ["One evening: Friday or Saturday", "En večer: petek al sobota"],
      checkout: ["One evening ticket for Endemit festival '27", "Karta za en večer za Endemit festival '27"],
      category: "Tickets",
      price: 55, // proposal, blind batch
      ticketQuantity: 1,
      cutoff: "2027-08-15T04:00:00+0000",
      template: "festival-evening",
      sorting: 908,
    },
    {
      uid: "endemit-festival-2027-tent",
      title: "Festival '27 tent rental",
      title_sl: "Festival '27 najem šotora",
      description: "An Endemit tent, set up and waiting for you at the camp. Limited number available.",
      description_sl: "Endemitski šotor, postavlen in prpravlen v kampo. Število je omejeno.",
      checkout: ["Tent rental at Endemit festival '27", "Najem šotora na Endemit festivalu '27"],
      category: "Other",
      price: 30,
      sorting: 900,
    },
    {
      uid: "endemit-festival-2027-bus-ljubljana",
      title: "Festival '27 bus from Ljubljana",
      title_sl: "Festival '27 bus Ljubljana – Libeliče – Ljubljana",
      description: "Bus transport from Ljubljana to the festival grounds in Libeliče.",
      description_sl: "Prevoz z busom iz Lublane do festivalskega placa v Libeličah.",
      checkout: ["Bus Ljubljana to Endemit festival '27", "Bus Lublana do Endemit festivala '27"],
      category: "Other",
      price: 15,
      sorting: 890,
    },
  ];

  // Drafts from earlier runs. With FESTIVAL_UPDATE=1 they are updated in place
  // instead of created (creating again fails: the UID is taken).
  const DRAFT_IDS: Record<string, string> = {
    "endemit-festival-2027-single-ticket": "awQzORIAAC0AIuWt",
    "endemit-festival-2027-duo-ticket": "awQzNhIAACwAIuWk",
    "endemit-festival-2027-group-ticket": "awQzNBIAAC0AIuWb",
    "endemit-festival-2027-evening-ticket": "awRkcRIAAC0AIz-4",
    "endemit-festival-2027-tent": "awQzMhIAAC0AIuWU",
    "endemit-festival-2027-bus-ljubljana": "awQzMBIAACcAIuWK",
  };
  const updating = process.env.FESTIVAL_UPDATE === "1";
  const wanted = only === "event" || only === "topups" ? [] : only === "day" ? products.filter(p => p.cutoff) : products;
  for (const p of wanted) {
    const productDoc =
      {
        type: "product",
        uid: p.uid,
        lang: sampleTicket.lang,
        tags: [],
        data: {
          title: p.title,
          title_sl: p.title_sl,
          description: rt(p.description),
          description_sl: rt(p.description_sl),
          special_notice: p.notice?.[0] ?? null,
          special_notice_sl: p.notice?.[1] ?? null,
          checkout_description: p.checkout[0],
          checkout_description_sl: p.checkout[1],
          images: [{ image: square }],
          product_category: p.category,
          product_type: "Digital",
          product_status: "Available",
          // Hidden keeps them out of the store listing; the festival page asks by uid.
          product_visibility: "Hidden",
          price: p.price,
          featured_product: false,
          sorting_weight: p.sorting,
          related_to_event: eventLink,
          related_products: [],
          ticket_quantity: p.ticketQuantity ?? null,
          ticket_template: p.template ?? null,
          variants: [],
          regional_eligibility: [],
          cutoff_date: p.cutoff ?? "2027-08-15T15:00:00+0000",
          display_content_slices: "Above description",
          slices: [],
        } as never,
      };
    const draftId = updating ? DRAFT_IDS[p.uid] : undefined;
    if (draftId) migration.updateDocument({ ...productDoc, id: draftId } as never, p.title);
    else migration.createDocument(productDoc as never, p.title);
  }

  // Festival Wallet top ups: copies of the shop's top ups that credit bonus
  // tokens (wallet_topup_reward). Bonus amounts are a proposal.
  if (only === "topups") {
    // Existing festival top ups; with FESTIVAL_UPDATE=1 they are updated in place.
    const TOPUP_IDS: Record<number, string> = { 20: "awR0UBIAACoAI1qL", 50: "awR0TRIAACkAI1qF", 100: "awR0SxIAACoAI1p9", 200: "awVfcBIAACgAJMUb" };
    // FESTIVAL_TOPUP_AMOUNTS=200 creates only the listed amounts (the others exist already).
    const amounts = process.env.FESTIVAL_TOPUP_AMOUNTS?.split(",").map(Number);
    for (const [amount, reward] of ([[20, 2], [50, 6], [100, 15], [200, 40]] as const).filter(([a]) => !amounts || amounts.includes(a))) {
      const source = await client.getByUID("product" as never, `wallet-top-up-${amount}-tokens`);
      const data = source.data as Record<string, unknown>;
      const topupDoc = {
          type: "product",
          uid: `endemit-festival-2027-top-up-${amount}`,
          lang: source.lang,
          tags: [],
          data: {
            ...data,
            title: `Festival '27 Wallet top up ${amount}`,
            title_sl: `Festival '27 polnitev denarnce ${amount}`,
            product_visibility: "Hidden",
            featured_product: false,
            wallet_topup_reward: reward,
            related_to_event: eventLink,
            // Sold until the end of the festival's last day: 15 Aug 2027, 23:59 in Slovenia (CEST).
            cutoff_date: "2027-08-15T21:59:00+0000",
          } as never,
        };
      const topupId = updating ? TOPUP_IDS[amount] : undefined;
      if (topupId) migration.updateDocument({ ...topupDoc, id: topupId } as never, `Festival '27 Wallet top up ${amount}`);
      else migration.createDocument(topupDoc as never, `Festival '27 Wallet top up ${amount}`);
    }
  }

  await client.migrate(migration, {
    reporter: e => {
      if (e.type.startsWith("documents:")) {
        const d = (e as { data?: { document?: { document?: { uid?: string; id?: string } } } }).data?.document?.document;
        console.log(e.type, d?.uid ?? "", d?.id ?? "");
      }
    },
  });
  console.log("Done. Review and publish the migration release in Prismic.");
}

main().catch(e => {
  console.error(e.message, JSON.stringify(e.response ?? "").slice(0, 1500));
  process.exit(1);
});
