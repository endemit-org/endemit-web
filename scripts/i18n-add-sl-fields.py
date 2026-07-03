#!/usr/bin/env python3
"""
Adds Slovenian `<field>_sl` twin fields to translatable text fields across all
Prismic custom types (customtypes/*/index.json) and shared slice models
(src/app/_prismic-slices/*/model.json).

Base fields keep English content; the app reads `<field>_sl ?? <field>` for the
sl locale (see src/domain/cms/pickLocalized.ts). Adding fields is non-breaking
for existing documents.

Usage:
  python3 scripts/i18n-add-sl-fields.py --dry-run   # show planned additions
  python3 scripts/i18n-add-sl-fields.py --apply     # write files
"""
import json
import glob
import os
import sys
import copy

TEXT_TYPES = {"StructuredText", "Text"}

# Skip fields whose name contains any of these (URLs, keys, config, ids, etc.)
SKIP_SUBSTR = [
    "url", "link", "template", "symbol", "timestamp", "soundcloud", "uid",
    "slug", "code", "hash", "coordinate", "email", "divider", "number",
    "vimeo", "class", "marker", "_id", "tabid",
]

# Full paths of text fields that should stay UNIVERSAL (no _sl twin) — proper
# nouns, addresses, internal notes, etc.
EXCLUDE_PATHS = {
    "podcast::Main.footnote",
    "podcast::Main.tracklist.artist",
    "podcast::Main.tracklist.title",
    "venue::About.address",
    "inner_content::Main.internal_description",
    "event::Schedule.artists.name_override",
    "artist::About.name",
    "artist_lineup::default.primary.artists.name_override",
    "artist_profile_list::default.primary.artists.name_override",
    "save_the_date::default.primary.save_the_date.title",
    "event_list::default.primary.save_the_date.title",
}

# Full paths of Link fields that SHOULD be language-specific (get an _sl twin so
# EN can point to a different document/URL than SL).
INCLUDE_LINK_PATHS = {
    "menu_navigation::Main.items.link",
    "footer_content::Main.links",
}

SL_SUFFIX = "_sl"


def is_translatable(name: str) -> bool:
    low = name.lower()
    if low.endswith(SL_SUFFIX):
        return False
    return not any(s in low for s in SKIP_SUBSTR)


def strip_sl(fields: dict) -> dict:
    """Remove all existing *_sl twins so the script is authoritative/idempotent."""
    out = {}
    for name, cfg in fields.items():
        if name.endswith(SL_SUFFIX):
            continue
        if cfg.get("type") == "Group":
            gcfg = cfg.get("config", {})
            if isinstance(gcfg.get("fields"), dict):
                cfg = copy.deepcopy(cfg)
                cfg["config"]["fields"] = strip_sl(gcfg["fields"])
        out[name] = cfg
    return out


def make_twin(cfg: dict) -> dict:
    twin = copy.deepcopy(cfg)
    inner = twin.get("config")
    if isinstance(inner, dict) and "label" in inner and inner["label"]:
        inner["label"] = f'{inner["label"]} (SL)'
    return twin


def should_add_twin(full_path: str, name: str, ftype: str) -> bool:
    if full_path in EXCLUDE_PATHS:
        return False
    if full_path in INCLUDE_LINK_PATHS:
        return True
    return ftype in TEXT_TYPES and is_translatable(name)


def process_fields(fields: dict, planned: list, path: str) -> dict:
    """Return a new ordered dict with _sl twins inserted after translatable
    fields, recursing into Group fields. Assumes existing twins were stripped."""
    out = {}
    for name, cfg in fields.items():
        ftype = cfg.get("type")
        full_path = f"{path}{name}"
        # Recurse into groups first (so nested twins are added in place)
        if ftype == "Group":
            gcfg = cfg.get("config", {})
            if isinstance(gcfg.get("fields"), dict):
                new_cfg = copy.deepcopy(cfg)
                new_cfg["config"]["fields"] = process_fields(
                    gcfg["fields"], planned, f"{full_path}."
                )
                out[name] = new_cfg
                continue
        out[name] = cfg
        if should_add_twin(full_path, name, ftype):
            twin_name = f"{name}{SL_SUFFIX}"
            out[twin_name] = make_twin(cfg)
            planned.append(f"{path}{twin_name}")
    return out


def process_custom_type(filepath: str, planned: list) -> dict:
    d = json.load(open(filepath))
    tabs = d.get("json", {})
    ctid = os.path.basename(os.path.dirname(filepath))
    for tabname, tab in tabs.items():
        tabs[tabname] = process_fields(strip_sl(tab), planned, f"{ctid}::{tabname}.")
    d["json"] = tabs
    return d


def process_slice(filepath: str, planned: list) -> dict:
    d = json.load(open(filepath))
    for v in d.get("variations", []):
        if isinstance(v.get("primary"), dict):
            v["primary"] = process_fields(strip_sl(v["primary"]), planned, f"{d.get('id')}::{v.get('id')}.primary.")
        if isinstance(v.get("items"), dict):
            v["items"] = process_fields(strip_sl(v["items"]), planned, f"{d.get('id')}::{v.get('id')}.items.")
    return d


def main():
    apply = "--apply" in sys.argv
    planned = []
    files = []

    for f in sorted(glob.glob("customtypes/*/index.json")):
        d = process_custom_type(f, planned)
        files.append((f, d))
    for f in sorted(glob.glob("src/app/_prismic-slices/*/model.json")):
        d = process_slice(f, planned)
        files.append((f, d))

    print(f"Planned {len(planned)} _sl twin fields:")
    for p in planned:
        print("  +", p)

    if apply:
        for f, d in files:
            with open(f, "w") as fh:
                json.dump(d, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
        print(f"\nApplied to {len(files)} files.")
    else:
        print("\n(dry run — pass --apply to write files)")


if __name__ == "__main__":
    main()
