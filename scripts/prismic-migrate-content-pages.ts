import { migrateDoc, type DocTranslations } from "./prismic-lib";

/**
 * Fills _sl fields on content_page documents (marketing/info pages) in Koroščina.
 * Legal/policy pages are handled separately (standard Slovenian). Drafts land in
 * the planned version.
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-content-pages.ts
 */

const PAGES: Record<string, DocTranslations> = {
  about: {
    type: "content_page",
    internalName: "About endemit",
    base: { title: "O Endemitu" },
    slices: {
      0: {
        primary: {
          content:
            "Endemit je kulturno društvo pa kolektiv posameznikov, ki jih vleče k zvoku, kodi pa sliki in v svojem času tiho ustvarjajo. Vsak projekt je odsev osebnih obsesij pa skupnih vrednot.\n" +
            "Naša snidenja so redki trenutki, ko ti notranji svetovi pridejo na plano – oblikovani s skrbjo, čustvom pa namenom. Nobena nista enaka, vsa pa prihajajo z istga mesta.\n" +
            "Premaknemo se sam, ko je trenutek pravi. Ko se, gradimo prostore, ki vabijo k prisotnosti – zase pa za tiste, ki nas najdejo.\n" +
            "Ustvarjali bomo, dokler je v nas neki, kar je vredno izrazit.",
        },
      },
      4: {
        primary: {
          content:
            "Vse, kar vidiš, slišiš pa se s tem igraš, smo naredli mi. Od vizualne identitete pa spletne platforme do ozvočenja pa produkcije dogodkov – vsak detajl oblikujemo interno, ljudje, ki jim je najbol mar.\n" +
            "Združujemo digitalne umetnike, producente, oblikovalce pa inženirje – vsak s svojimi obsesijami, povezani s skupnim standardom za obrt pa pozornost do detajlov.",
        },
      },
      6: { primary: { heading: "O našem društvu" } },
      8: {
        primary: {
          title: "Endemit umetniki",
          description: "Redni talenti na naših dogodkih, po abecedi.",
        },
      },
      10: {
        primary: {
          title: "Kako nas podpret?",
          description:
            "Cenimo vsako pomoč pa spodbudo za naše prostovoljno delo. En način, da nam pomagaš, je, da si privoščiš kos ali dva iz našga mercha, vstopnic pa drugih izdelkov.",
        },
      },
    },
  },
  artists: {
    type: "content_page",
    internalName: "Artists",
    base: { title: "Umetniki" },
    slices: {
      0: {
        primary: {
          content:
            "Endemit združuje umetnike z vsega sveta. To so umetniki, ki so v živo nastopili na naših dogodkih ali v naših podcast sessionih.",
        },
      },
      1: {
        primary: {
          title: "Endemit umetniki",
          description: "Redni talenti na naših dogodkih, po abecedi.",
        },
      },
      3: {
        primary: {
          title: "Gostujoči umetniki",
          description:
            "V čast pa privilegij nam je, da na naših dogodkih gostimo nekatere najbol priznane umetnike. Po abecedi.",
        },
      },
    },
  },
  events: {
    type: "content_page",
    internalName: "Events",
    base: { title: "Dogodki" },
    slices: {
      0: { primary: { title: "Prihajajoči dogodki" } },
      2: { primary: { heading: "Utrinki z naših dogodkov" } },
      4: { primary: { title: "Pretekli dogodki" } },
      6: {
        primary: {
          override_title: "Naši dogodki so redki in omejeni s kapaciteto",
          override_description: "Naroči se na naše novice, da boš takoj obveščen!",
        },
      },
    },
  },
  music: {
    type: "content_page",
    internalName: "Music",
    base: { title: "Glasba" },
    slices: {
      // hero.heading "Seiichiro Itoyama" is an artist name (universal) -> skip
      0: { primary: { description: "emit 012 · Zadnja epizoda" } },
      1: {
        primary: {
          description:
            "Prva založniška izdaja MMalija. Limitirana edicija, prvi pres.",
        },
      },
      2: {
        // podcast_list title "Emit" is the series brand -> keep universal
        primary: {
          description:
            "Emit je kurirana podcast serija Endemita – zvočna kronika underground techno kulture kolektiva. Več ko sam miks serija; služi ko arhiv pa ojačevalec endemitskga sounda.\n" +
            "Vsaka epizoda ujame ali live posnetek z Endemit dogodka, da ohrani surovo energijo trenutka, ali posebej izdelan studijski miks, ki predstavla trenutno zvočno razskovanje umetnika. Serija predstavla rezidente, mednarodne goste, ki so počastili Endemit dogodke, pa vzhajajoče regionalne talente, ki se ujemajo z vizijo kolektiva o naprednem, hipnotičnem technu.",
        },
      },
    },
  },
  venues: {
    type: "content_page",
    internalName: "Venues",
    base: { title: "Prizorišča" },
    slices: {
      0: { primary: { title: "Ti kraji so dom naših dogodkov" } },
      2: {
        primary: {
          override_title: "Ne zamudi naslednjga dogodka",
          override_description:
            "Naroči se pa bodi obveščen, ko so vstopnice na volo.",
        },
      },
    },
  },
  store: {
    type: "content_page",
    internalName: "Support our cause",
    base: { title: "Podpri našo stvar" },
    slices: {
      0: {
        primary: {
          content:
            "Smo majhno neprofitno društvo, osredotočeno na ustvarjanje intimnih pa varnih snidenj z nepozabnim zvokom. Hvaležni smo za vsako podporo prek vstopnic, mercha pa donacij. Hvala 🙏",
        },
      },
      1: {
        primary: {
          title: "🔥 Izpostavljeni izdelki",
          description: "Podpri nas z nakupom naših izdelkov pa vstopnic.",
        },
      },
      3: {
        // collab_promo title "Hands of the Creator" is a brand -> universal
        primary: {
          description:
            "Naša kolaboracija s HOTC ob Rhaegalovem novem albumu Darkest And Oddest Shades. LP je razprodan, digitalni album pa majce so še na volo.",
        },
      },
      5: {
        primary: {
          title: "Napolni za festival",
          description:
            "Napolni ǝŧ žetone za uporabo EndePay na festivalu avgusta.",
        },
      },
      6: {
        primary: { headline: "Dobi svojo izdajo", description: "Prvi Endemit EP" },
      },
      7: {
        primary: {
          title: "Uradni endemit merch",
          description: "Zastopaj skupnost pa strast na svojem naslednjem dogodku.",
        },
      },
    },
  },
  endepay: {
    type: "content_page",
    internalName: "Endepay",
    base: { title: "Endepay" },
    slices: {
      0: {
        primary: {
          title: "Kmalu več vsebine",
          description:
            "Ende Pay vodiči pa podrobnosti pridejo čez teden dni. Vrni se kmalu za prikaz, kk deluje.",
        },
      },
      1: {
        primary: {
          title: "Napolni svojo denarnico",
          description:
            "Pripravi denarnico za pijačo, hrano, merch pa druge drobnarije.",
        },
      },
      2: {
        primary: {
          content:
            "Če porabiš limit na kreditni ali debitni kartici, lahk EndePay napolniš tut z gotovino na Merch stojnici na festivalu. Priporočamo, da je najlažji pa najhitrejši način spletno polnjenje.",
        },
      },
      4: {
        primary: { heading: "EndePay pogosta vprašanja" },
        items: [
          {
            title: "Kaj je EndePay?",
            content:
              "EndePay je brezgotovinski način plačila na festivalu. Z njim kupiš pijačo, hrano, merch pa druge posebne ponudbe na festivalu. In ja, uporabiš ga lahk za napitnino. 100 % napitnine gre osebju, ki je izvedlo transakcijo.",
          },
          {
            title: "Ali za uporabo EndePay rabim uporabniški račun?",
            content:
              "Ja, sam prijavi se v svoj profil z e-naslovom. Na e-pošto dobiš kratko kodo za potrditev in že si notr pa pripravlen za uporabo EndePay. Brez gesel, brez težav.",
          },
          {
            title: "Kk napolnim svoje stanje?",
            content:
              "Svoje EndePay stanje napolniš spletno s kreditno kartico, Apple Pay ali Google Pay. Polnjenje s kartico je na volo pred pa med festivalom, stanje pa lahk napolniš tut na dogodku na naši Merch stojnici z gotovino. Stanje lahk zmerm preveriš na svojem registriranem Endemit profilu.",
          },
          {
            title: "Ka se zgodi z neporabljenim stanjem denarnice?",
            content:
              "Preostalo stanje lahk porabiš na naslednjem dogodku s podporo EndePay ali pa na strani endemit.org za nakup vstopnic, mercha, albumov ali za donacije. Sredstva lahk pošlješ tut drugmo uporabniku, tko da skeniraš kodo njegovga profila. Stanje lahk porabiš v celoti ali delno za prihodnje nakupe – ampak upoštevaj, da vračilo denarja ni mogoče.",
          },
          {
            title: "Ka se zgodi, če mi zmanka baterije?",
            content:
              "Za to mamo rezervo. Na festivalu najdi QR nalepko, ki jo skeniraš v svoj endemit profil za rezervni način plačila. Ko je to narejeno, lahk to QR nalepko uporabiš tut za plačilo pa polnjenje stanja (z gotovino).",
          },
          {
            title: "Kakšen je menjalni tečaj za ǝŧ?",
            content:
              "Preprosto: 1 € = 1 ǝŧ (Endemit žeton). Brez računanja pretvorb.",
          },
          {
            title: "Ali lahk stanje prenesem prijatelju?",
            content:
              "Ja, stanje lahk pošlješ drugim uporabnikom za vračilo ali da dodaš svoj delež pri skupnih nakupih.",
          },
        ],
      },
    },
  },
};

async function main() {
  for (const [uid, t] of Object.entries(PAGES)) {
    console.log(`\n${uid}:`);
    await migrateDoc(uid, t);
  }
  console.log("\nMarketing content pages done.");
}

main().catch(err => {
  console.error("Content pages migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
