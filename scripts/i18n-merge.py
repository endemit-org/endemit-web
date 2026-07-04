#!/usr/bin/env python3
"""Deep-merge additional UI keys into messages/{en,sl}.json (additive, preserves
existing keys). Run with two module-level dicts EN_NEW / SL_NEW set below."""
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
        "miniCard": {"wasOn": "Was on {date}", "happeningOn": "Happening on {date}"},
        "ticketStatus": {"hot": "Hot", "ticketsLimited": "Tickets limited"},
        "ticketsDisplay": {
            "hot": "Hot",
            "freeAdmission": "FREE admission",
            "noTicketsRequired": "No tickets required",
            "noLongerAvailable": "Tickets no longer available",
            "eventConcluded": "This event has concluded.",
            "comingSoon": "Tickets coming soon",
            "notForSaleYet": "Tickets are not for sale yet",
            "notAvailableOnline": "Tickets not available online",
            "onlineSoldOut": "Online tickets SOLD OUT",
            "availableAtEntrance": "Tickets are available at entrance",
            "batchSoldOut": "Ticket batch sold out",
            "batchComingSoon": "Next ticket batch coming soon",
            "availableNow": "Tickets available now",
        },
        "lineup": {
            "sortBy": "Sort by:",
            "sort": {"default": "Default", "performanceTime": "Performance Time", "alphabetical": "Alphabetically"},
        },
        "saveTheDate": {"secret": "Nice try, it's a secret!"},
    },
    "store": {
        "product": {"price": "Price:", "selectQuantity": "Select quantity", "checkout": "Checkout", "expired": "Expired"},
    },
    "profile": {
        "ticketBadge": {"validated": "VALIDATED", "pending": "PENDING", "scanned": "SCANNED"},
        "announcement": {"dismiss": "Dismiss announcement"},
        "topUp": {"hot": "Hot", "selectAmount": "Select an amount"},
        "wallet": {"payQrAlt": "Wallet QR"},
        "wristband": {"whatIsThis": "What is this?", "showQr": "Show QR"},
        "ticketDownload": {"failed": "Failed to generate ticket", "noResponse": "No response from server"},
    },
}

SL_NEW = {
    "events": {
        "miniCard": {"wasOn": "Blo {date}", "happeningOn": "Bo {date}"},
        "ticketStatus": {"hot": "Vroče", "ticketsLimited": "Karte pohajajo"},
        "ticketsDisplay": {
            "hot": "Vroče",
            "freeAdmission": "ZASTONJ vstop",
            "noTicketsRequired": "Karte niso potrebne",
            "noLongerAvailable": "Kart ni več",
            "eventConcluded": "Ta dogodek je mimo.",
            "comingSoon": "Karte pridejo kmau",
            "notForSaleYet": "Karte še niso naprodaj",
            "notAvailableOnline": "Kart ni na spletu",
            "onlineSoldOut": "Spletne karte RAZPRODANE",
            "availableAtEntrance": "Karte dobiš na vhodu",
            "batchSoldOut": "Ta runda kart je razprodana",
            "batchComingSoon": "Naslednja runda kart kmau",
            "availableNow": "Karte so na voljo zdej",
        },
        "lineup": {
            "sortBy": "Razvrsti po:",
            "sort": {"default": "Privzeto", "performanceTime": "Po času nastopa", "alphabetical": "Po abecedi"},
        },
        "saveTheDate": {"secret": "Lep poskus, ampak to je skrivnost!"},
    },
    "store": {
        "product": {"price": "Cena:", "selectQuantity": "Izberi količino", "checkout": "Na blagajno", "expired": "Poteklo"},
    },
    "profile": {
        "ticketBadge": {"validated": "POTRJENA", "pending": "ČAKA", "scanned": "SKENIRANA"},
        "announcement": {"dismiss": "Zapri obvestilo"},
        "topUp": {"hot": "Vroče", "selectAmount": "Izberi znesek"},
        "wallet": {"payQrAlt": "QR denarnce"},
        "wristband": {"whatIsThis": "Kaj je to?", "showQr": "Pokaži QR"},
        "ticketDownload": {"failed": "Karte ni ratalo ustvarit", "noResponse": "Strežnik ne odgovarja"},
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
