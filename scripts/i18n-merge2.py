#!/usr/bin/env python3
"""Second additive deep-merge of UI keys (final exhaustive sweep) into messages/{en,sl}.json."""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "messages"


def deep_merge(base: dict, patch: dict) -> dict:
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base


EN_NEW = {
    "events": {
        "moreAnnouncedSoon": "More events will be announced soon",
        "detailsComingSoon": "Details coming soon",
        "festivalTag": "Festival",
        "saveTheDate": {"heading": "{count, plural, one {Save the date} other {Save the dates}}"},
    },
    "store": {
        "product": {
            "noLongerAvailable": "Product no longer available",
            "selectVariant": "Select {variantType}",
            "inCart": "(You have {count} in <link>cart</link>)",
            "addToCart": "Add to cart",
            "addedToCart": "<strong>{name}</strong> was added to your cart!",
            "remaining": "{time} remaining",
            "statusText": {
                "available": "available",
                "preorder": "preorder",
                "comingSoon": "coming soon",
                "outOfStock": "out of stock",
                "soldOut": "sold out",
            },
        },
    },
    "profile": {
        "tickets": {
            "guestList": "Guest List",
            "viewTicket": "View Ticket",
            "noneYet": "No tickets yet",
            "noneYetDesc": "When you purchase event tickets, they will appear here.",
            "activeTitle": "Active Tickets",
            "pastTitle": "Past Tickets",
            "qrAlt": "Ticket QR Code",
        },
        "orders": {
            "emptyDesc": "When you make a purchase, your orders will appear here.",
            "itemCountLabel": "{count, plural, one {# item} other {# items}}",
            "ticketsIncluded": "{count, plural, one {# ticket} other {# tickets}} included",
        },
        "topUp": {
            "noOptions": "No top-up options available at the moment.",
            "selectAmountDesc": "Select an amount of tokens to add to your wallet",
            "redirecting": "Redirecting...",
            "addToWallet": "Add {amount} to Wallet",
            "cashNotice": "You can also top up the wallet with cash at the MERCH stand.",
        },
        "walletPay": {
            "pay": "Pay",
            "balance": "Balance",
            "handPhoneHint": "Hand your phone to the seller — they will scan this code to charge your wallet.",
        },
        "wristband": {
            "linkForOffline": "Link a wristband for offline checkout",
            "infoText": "Tap to show a QR sellers can scan at POS registers to charge your wallet. Linking a wristband gives you the same code on a physical bracelet, so you can pay even without a phone.",
            "stickerConflictOther": "This sticker is linked to another account.",
            "stickerSwapRequired": "You already have sticker {code} linked. Unlink it first.",
            "scanHint": "Point your camera at the QR on your wristband.",
        },
        "eventsAttended": {
            "title": "Events Attended",
            "claimMissing": "Claim missing event",
            "empty": "No events attended yet.",
            "countLabel": "{count, plural, one {# event} other {# events}}",
            "pendingClaims": "Pending Claims",
            "artistsAtEvents": "Artists at events",
            "claimFailed": "Failed to submit claim",
            "claimModalTitle": "Claim Missing Event",
            "noPastEvents": "No past events available to claim.",
            "claimModalDesc": "Select an event you attended but don't have a ticket for. Claims are reviewed and typically approved within a few minutes.",
            "submitting": "Submitting...",
            "submitClaim": "Submit Claim",
        },
        "upcomingPromo": {
            "title": "Upcoming Events",
            "subtitle": "Don't miss out - get your tickets!",
            "ticketsAvailable": "Tickets Available",
        },
        "ticketDownload": {"generating": "Generating...", "downloadImage": "Download Ticket Image"},
    },
    "artists": {"liveNow": "LIVE NOW", "timeUntilPrefix": "in"},
    "music": {
        "episodeLabel": "Episode {number}",
        "byPrefix": "by",
        "playing": "Playing",
        "playEpisode": "Play Episode",
        "viewDetails": "View Details",
        "aboutEpisode": "About this episode",
        "listenToEpisode": "Listen to the episode",
        "currentlyPlaying": "Currently playing",
        "tracklist": "Tracklist",
        "labels": {"episode": "Episode", "artist": "Artist", "published": "Published"},
        "player": {"allowPlay": "Allow play", "collapse": "Collapse player", "close": "Close player"},
    },
}

SL_NEW = {
    "events": {
        "moreAnnouncedSoon": "Kmalu razkrijemo še več dogodkov",
        "detailsComingSoon": "Podrobnosti kmau",
        "festivalTag": "Festival",
        "saveTheDate": {"heading": "{count, plural, one {Zapiši si datum} two {Zapiši si datuma} few {Zapiši si datume} other {Zapiši si datume}}"},
    },
    "store": {
        "product": {
            "noLongerAvailable": "Izdelka ni več",
            "selectVariant": "Izberi {variantType}",
            "inCart": "(V <link>košari</link> jih maš {count})",
            "addToCart": "Vrž v košaro",
            "addedToCart": "<strong>{name}</strong> je v košari!",
            "remaining": "še {time}",
            "statusText": {
                "available": "na voljo",
                "preorder": "prednaročilo",
                "comingSoon": "kmau",
                "outOfStock": "razprodano",
                "soldOut": "razprodano",
            },
        },
    },
    "profile": {
        "tickets": {
            "guestList": "Seznam gostov",
            "viewTicket": "Poglej karto",
            "noneYet": "Zaenkrat ni kart",
            "noneYetDesc": "Ko kupiš karte za dogodek, se pojavijo tukej.",
            "activeTitle": "Aktivne karte",
            "pastTitle": "Pretekle karte",
            "qrAlt": "QR koda karte",
        },
        "orders": {
            "emptyDesc": "Ko kej kupiš, se naročila pojavijo tukej.",
            "itemCountLabel": "{count, plural, one {# reč} two {# reči} few {# reči} other {# reči}}",
            "ticketsIncluded": "vključuje {count, plural, one {# karto} two {# karti} few {# karte} other {# kart}}",
        },
        "topUp": {
            "noOptions": "Trenutno ni možnosti za polnjenje.",
            "selectAmountDesc": "Izberi, koliko žetonov daš v denarnco",
            "redirecting": "Preusmerjam…",
            "addToWallet": "Dodaj {amount} v denarnco",
            "cashNotice": "Denarnco lahko napolniš tut s kešom na MERCH štantu.",
        },
        "walletPay": {
            "pay": "Plačaj",
            "balance": "Stanje",
            "handPhoneHint": "Daj telefon prodajalcu — skenira to kodo pa ti obremeni denarnco.",
        },
        "wristband": {
            "linkForOffline": "Poveži zapestnco za plačilo brez telefona",
            "infoText": "Tapni za QR, k ga prodajalci skenirajo na POS blagajni pa ti obremenijo denarnco. Če povežeš zapestnco, maš isto kodo na pravi zapestnci, tk da lahko plačaš tut brez telefona.",
            "stickerConflictOther": "Ta nalepka je povezana z drugim računom.",
            "stickerSwapRequired": "Že maš povezano nalepko {code}. Najprej jo odkleni.",
            "scanHint": "Usmeri kamero v QR na svoji zapestnci.",
        },
        "eventsAttended": {
            "title": "Obiskani dogodki",
            "claimMissing": "Prijavi manjkajoč dogodek",
            "empty": "Še ni obiskanih dogodkov.",
            "countLabel": "{count, plural, one {# dogodek} two {# dogodka} few {# dogodki} other {# dogodkov}}",
            "pendingClaims": "Čakajoče prijave",
            "artistsAtEvents": "Umetniki na dogodkih",
            "claimFailed": "Prijave ni ratalo oddat",
            "claimModalTitle": "Prijavi manjkajoč dogodek",
            "noPastEvents": "Ni preteklih dogodkov za prijavo.",
            "claimModalDesc": "Izberi dogodek, k si ga obiskal, pa zanj nimaš karte. Prijave pregledamo pa običajno potrdimo v nekaj minutah.",
            "submitting": "Oddajam…",
            "submitClaim": "Oddaj prijavo",
        },
        "upcomingPromo": {
            "title": "Prihajajoči dogodki",
            "subtitle": "Ne zamud — zgrab karte!",
            "ticketsAvailable": "Karte na voljo",
        },
        "ticketDownload": {"generating": "Ustvarjam…", "downloadImage": "Prenesi sliko karte"},
    },
    "artists": {"liveNow": "ZDEJ V ŽIVO", "timeUntilPrefix": "čez"},
    "music": {
        "episodeLabel": "Epizoda {number}",
        "byPrefix": "od",
        "playing": "Igra",
        "playEpisode": "Predvajaj epizodo",
        "viewDetails": "Poglej podrobnosti",
        "aboutEpisode": "O tej epizodi",
        "listenToEpisode": "Poslušej epizodo",
        "currentlyPlaying": "Trenutno se vrti",
        "tracklist": "Tracklist",
        "labels": {"episode": "Epizoda", "artist": "Umetnik", "published": "Objavljeno"},
        "player": {"allowPlay": "Dovoli predvajanje", "collapse": "Skrči predvajalnik", "close": "Zapri predvajalnik"},
    },
}


def apply(name: str, patch: dict) -> None:
    path = MESSAGES / name
    data = json.loads(path.read_text(encoding="utf-8"))
    deep_merge(data, patch)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"merged into {name}")


apply("en.json", EN_NEW)
apply("sl.json", SL_NEW)
print("done")
