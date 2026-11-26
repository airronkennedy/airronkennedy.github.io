#!/usr/bin/env python3
"""Regenerate /stats/data.json for airronkennedy.com from the GoatCounter API.

The API token is read from a box-local file and is never written to the repo
or to any client-side file:

  /home/box/agent-data/agents/c135bd7d-cf3a-412b-b30c-a9154a028293/goatcounter-api-token.txt

Usage:
  update-stats.py [--repo PATH] [--out PATH] [--no-commit] [--push]

--push updates origin/main from a throwaway worktree so other ghsite
checkouts are left alone. Never force-pushes. Commits only stats/data.json.
"""
from __future__ import annotations

import argparse
import csv
import datetime
import gzip
import io
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from zoneinfo import ZoneInfo

TOKEN_FILE = "/home/box/agent-data/agents/c135bd7d-cf3a-412b-b30c-a9154a028293/goatcounter-api-token.txt"
API = "https://airronkennedy.goatcounter.com/api/v0"
DEFAULT_REPO = "/workspace/ghsite"
START = "2026-11-07"  # GoatCounter went live this day
TZ = ZoneInfo("America/Los_Angeles")
PT_START = "2026-11-07T00:00:00-08:00"

SIZE_LABELS = {
    "phone": "Phones",
    "tablet": "Tablets and large phones",
    "desktop": "Computer monitors",
    "desktophd": "Computer monitors larger than HD",
    "unknown": "Unknown",
}

PLANET_ORDER = [
    "Orbit / Home",
    "Experience Planet",
    "Games Planet",
    "Airron's Fall",
    "Airron's Quest",
    "Commander Wall",
    "Work Planet",
    "Team Task Tracker",
    "Weston's Planet",
    "Christmas Planet",
    "Riftstrike",
    "Other",
]

CLICK_LABELS = {
    "click/resume": "Resume",
    "click/linkedin": "LinkedIn",
    "click/github": "GitHub",
    "click/mtg-commander": "Magic Commander",
    "click/airrons-fall": "Airron's Fall",
    "click/airrons-quest": "Airron's Quest",
}


def load_token():
    if not os.path.exists(TOKEN_FILE):
        print("NO TOKEN: create a GoatCounter API token and save it to " + TOKEN_FILE)
        sys.exit(2)
    return open(TOKEN_FILE).read().strip()


TOKEN = None


def req(path, method="GET", body=None, raw=False):
    r = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
    )
    for _ in range(5):
        try:
            with urllib.request.urlopen(r, timeout=90) as resp:
                data = resp.read()
                return data if raw else json.loads(data or b"{}")
        except urllib.error.HTTPError as e:
            err = e.read()
            if e.code == 429:
                time.sleep(int(e.headers.get("X-Rate-Limit-Reset", "5")) + 1)
                continue
            raise RuntimeError(f"HTTP {e.code} {path}: {err[:400]!r}") from e


def q(**kw):
    items = []
    for k, v in kw.items():
        if v is None:
            continue
        items.append((k, v))
    return "?" + urllib.parse.urlencode(items)


def now_pt():
    return datetime.datetime.now(TZ)


def today_pt():
    return now_pt().date()


def start_param(day: str) -> str:
    # Site timezone is America/Los_Angeles; pin the start so days line up in PT.
    return f"{day}T00:00:00-08:00"


def range_start(key: str) -> str:
    today = today_pt()
    if key == "day":
        return start_param(today.isoformat())
    if key == "week":
        return start_param((today - datetime.timedelta(days=6)).isoformat())
    if key == "month":
        return start_param((today - datetime.timedelta(days=29)).isoformat())
    return PT_START


def stat(page, start, limit=100):
    out, more, offset = [], True, 0
    while more and offset < 1000:
        d = req(f"/stats/{page}" + q(start=start, limit=limit, offset=offset))
        out.extend(d.get("stats") or [])
        more = d.get("more")
        offset += limit
    return out


def named_rows(page, start):
    rows = []
    for s in stat(page, start):
        name = (s.get("name") or s.get("id") or "").strip() or "(unknown)"
        rows.append({"name": name, "id": s.get("id"), "count": s.get("count", 0), "ref_scheme": s.get("ref_scheme")})
    return rows


def clean_rows(rows, drop_zero=True):
    out = []
    for r in rows:
        if drop_zero and not r.get("count"):
            continue
        item = {"name": r["name"], "count": r.get("count", 0)}
        out.append(item)
    return out


def location_regions(start):
    regions = []
    for country in stat("locations", start):
        cid = country.get("id")
        cname = (country.get("name") or cid or "Unknown").strip() or "Unknown"
        if not cid:
            if country.get("count"):
                regions.append({"name": cname, "count": country.get("count", 0)})
            continue
        detail = req(f"/stats/locations/{urllib.parse.quote(str(cid))}" + q(start=start, limit=100))
        kids = detail.get("stats") or []
        if not kids:
            if country.get("count"):
                regions.append({"name": cname, "count": country.get("count", 0)})
            continue
        for s in kids:
            region = (s.get("name") or "").strip()
            label = f"{region}, {cname}" if region else cname
            regions.append({"name": label, "count": s.get("count", 0)})
    regions = [r for r in regions if r["count"]]
    regions.sort(key=lambda x: -x["count"])
    return regions


def devices_and_screens(start):
    devices, screens = [], []
    for s in stat("sizes", start):
        sid = s.get("id") or "unknown"
        label = SIZE_LABELS.get(sid, s.get("name") or sid.title() or "Unknown")
        if s.get("count"):
            devices.append({"name": label, "id": sid, "count": s.get("count", 0)})
        detail = req(f"/stats/sizes/{urllib.parse.quote(str(sid))}" + q(start=start, limit=100))
        for row in detail.get("stats") or []:
            raw = (row.get("name") or "").replace("\u2194\ufe0e", "").replace("\u2194", "").strip()
            if not raw or not row.get("count"):
                continue
            screens.append({"name": f"{raw} · {label}", "count": row.get("count", 0)})
    screens.sort(key=lambda x: -x["count"])
    return clean_rows(devices), screens


def browser_versions(start):
    versions = []
    for b in stat("browsers", start):
        bid = b.get("id") or b.get("name")
        if not bid:
            if b.get("count"):
                versions.append({"name": "(unknown)", "count": b.get("count", 0)})
            continue
        detail = req(f"/stats/browsers/{urllib.parse.quote(str(bid))}" + q(start=start, limit=50))
        kids = detail.get("stats") or []
        if not kids and b.get("count"):
            versions.append({"name": b.get("name") or str(bid), "count": b.get("count", 0)})
            continue
        for s in kids:
            name = (s.get("name") or "").strip() or str(bid)
            if s.get("count"):
                versions.append({"name": name, "count": s.get("count", 0)})
    versions.sort(key=lambda x: -x["count"])
    return versions


def fetch_hits(start):
    hits, more = [], True
    exclude = []
    while more:
        kw = dict(start=start, limit=100, daily="true")
        if exclude:
            kw["exclude_paths"] = ",".join(exclude)
        d = req("/stats/hits" + q(**kw))
        new = d.get("hits") or []
        hits.extend(new)
        exclude.extend(str(h["path_id"]) for h in new if h.get("path_id") is not None)
        more = bool(d.get("more") and new)
        if not new:
            break
    return hits


def event_name(path, prefix):
    marker = prefix + "/"
    if marker not in path:
        return None
    return urllib.parse.unquote(path.split(marker, 1)[1])


def normalize_path(path: str) -> str:
    p = path or ""
    if p.startswith("http://") or p.startswith("https://"):
        try:
            u = urllib.parse.urlparse(p)
            p = u.path or "/"
        except Exception:
            pass
    if not p.startswith("/") and not p.startswith("click/") and "visitor/" not in p and "player/" not in p and p != "recruiter-skip":
        # events sometimes have no leading slash
        pass
    if p.endswith("/") and p != "/":
        p = p[:-1]
    return p


def planet_for(path: str) -> str | None:
    p = normalize_path(path).split("?", 1)[0].lower()
    if not p.startswith("/"):
        return None
    if p in ("/",):
        return "Orbit / Home"
    if p == "/work" or p.startswith("/work/"):
        return "Experience Planet"
    if p == "/games" or p.startswith("/games/"):
        return "Games Planet"
    if p == "/arena" or p.startswith("/arena/"):
        return "Airron's Fall"
    if p == "/quest" or p.startswith("/quest/"):
        return "Airron's Quest"
    if p == "/commanders" or p.startswith("/commanders/"):
        return "Commander Wall"
    if p == "/ops" or p.startswith("/ops/"):
        return "Work Planet"
    if p == "/tracker" or p.startswith("/tracker/"):
        return "Team Task Tracker"
    if p == "/weston" or p.startswith("/weston/"):
        return "Weston's Planet"
    if p == "/christmas" or p.startswith("/christmas/"):
        return "Christmas Planet"
    if p.startswith("/riftstrike"):
        return "Riftstrike"
    if p.startswith("/stats"):
        return None
    return "Other"


def is_event_path(path: str, event_flag=None) -> bool:
    if event_flag:
        return True
    p = path or ""
    return (
        p.startswith("work-visitor/")
        or p.startswith("/work-visitor/")
        or p.startswith("arena-player/")
        or p.startswith("/arena-player/")
        or p.startswith("click/")
        or p.startswith("/click/")
        or p.rstrip("/") in ("recruiter-skip", "/recruiter-skip")
        or "recruiter-skip" == p
    )


def classify_hits(hits):
    pages, visitors, arena_players, clicks, recruiter_events = [], [], [], [], []
    recruiter_pages = []
    planets = defaultdict(int)
    for h in hits:
        p = h.get("path") or ""
        count = h.get("count", 0)
        if p.startswith("work-visitor/") or p.startswith("/work-visitor/"):
            name = event_name(p, "work-visitor")
            for day in h.get("stats") or []:
                if day.get("daily") and name:
                    visitors.append({"name": name, "day": day["day"], "count": day["daily"]})
            continue
        if p.startswith("arena-player/") or p.startswith("/arena-player/"):
            name = event_name(p, "arena-player")
            for day in h.get("stats") or []:
                if day.get("daily") and name:
                    arena_players.append({"name": name, "day": day["day"], "count": day["daily"]})
            continue
        if p.startswith("click/") or p.startswith("/click/"):
            key = p[1:] if p.startswith("/click/") else p
            label = CLICK_LABELS.get(key, key.split("/", 1)[-1].replace("-", " ").title())
            clicks.append({"name": label, "path": key, "count": count})
            continue
        if p.rstrip("/") in ("recruiter-skip", "/recruiter-skip"):
            for day in h.get("stats") or []:
                if day.get("daily"):
                    recruiter_events.append({"day": day["day"], "count": day["daily"]})
            continue
        if p.startswith("/stats"):
            continue
        if h.get("event"):
            continue
        pages.append({"name": p, "count": count})
        if "r=recruiter" in p:
            recruiter_pages.append({"name": p, "count": count})
        planet = planet_for(p)
        if planet:
            planets[planet] += count
    planet_rows = [{"name": n, "count": planets[n]} for n in PLANET_ORDER if planets.get(n)]
    for n, c in sorted(planets.items(), key=lambda x: -x[1]):
        if n not in PLANET_ORDER:
            planet_rows.append({"name": n, "count": c})
    clicks.sort(key=lambda x: -x["count"])
    pages.sort(key=lambda x: -x["count"])
    return pages, visitors, arena_players, clicks, recruiter_events, recruiter_pages, planet_rows


def source_rows(referrers, recruiter_page_total, linkedin_extra=0):
    out = []
    linkedin = 0
    direct = 0
    other = []
    for r in referrers:
        name = r.get("name") or ""
        scheme = r.get("ref_scheme")
        count = r.get("count", 0)
        low = name.lower()
        if "linkedin" in low:
            linkedin += count
        elif name in ("(unknown)", "", "(none)") or scheme == "o":
            direct += count
        else:
            other.append({"name": name, "count": count})
    if linkedin or linkedin_extra:
        out.append({"name": "LinkedIn", "count": linkedin or linkedin_extra})
    if recruiter_page_total:
        out.append({"name": "Recruiter link (?r=recruiter)", "count": recruiter_page_total})
    if direct:
        out.append({"name": "Direct / unknown", "count": direct})
    out.extend(other)
    return out


def pretty_referrers(referrers):
    out = []
    for r in referrers:
        name = r.get("name") or ""
        scheme = r.get("ref_scheme")
        if name in ("", "(none)") or (not name and scheme == "o"):
            name = "Direct / unknown"
        elif name == "(unknown)" and scheme == "o":
            name = "Direct / unknown"
        elif name == "(unknown)":
            name = "Direct / unknown"
        out.append({"name": name, "count": r.get("count", 0)})
    return [r for r in out if r["count"]]


_EVENT_PATH_IDS = None

def all_paths():
    out, more = [], True
    while more:
        kw = dict(limit=100)
        # /paths has no documented pagination besides maybe ?after; try offset-style first
        d = req("/paths" + q(limit=200))
        paths = d.get("paths") or []
        # If the endpoint always returns the first page, just take it once.
        out = paths
        more = bool(d.get("more"))
        if more:
            # Some versions paginate with after / last id
            last = paths[-1].get("id") if paths else None
            extra, guard = [], 0
            while more and last and guard < 20:
                guard += 1
                d = req("/paths" + q(limit=200, after=last))
                nxt = d.get("paths") or []
                if not nxt or nxt[0].get("id") == last:
                    break
                extra.extend(nxt)
                last = nxt[-1].get("id")
                more = bool(d.get("more"))
            out = paths + extra
        break
    return out


def event_path_ids():
    global _EVENT_PATH_IDS
    if _EVENT_PATH_IDS is not None:
        return _EVENT_PATH_IDS
    ids = []
    for p in all_paths():
        path = p.get("path") or ""
        if p.get("event") or is_event_path(path):
            if p.get("id") is not None:
                ids.append(str(p["id"]))
    _EVENT_PATH_IDS = ids
    return ids


def event_dailies(hits):
    buckets = defaultdict(int)
    for h in hits:
        path = h.get("path") or ""
        if h.get("event") or is_event_path(path):
            for day in h.get("stats") or []:
                if day.get("day") and day.get("daily"):
                    buckets[day["day"]] += day["daily"]
    return buckets


def adjust_daily(days, hits):
    ev = event_dailies(hits)
    today = today_pt().isoformat()
    out = []
    for row in days:
        if row["day"] > today:
            continue
        out.append({"day": row["day"], "visits": max(0, row["visits"] - ev.get(row["day"], 0))})
    return out


def totals_for(start):
    total = req("/stats/total" + q(start=start))
    days = []
    hourly_today = []
    today = today_pt().isoformat()
    yesterday = (today_pt() - datetime.timedelta(days=1)).isoformat()
    for s in total.get("stats") or []:
        day = s.get("day")
        daily = s.get("daily") or 0
        if day and day >= START:
            days.append({"day": day, "visits": daily})
        if day in (today, yesterday):
            hours = s.get("hourly") or []
            for i, n in enumerate(hours):
                hourly_today.append({"day": day, "hour": i, "visits": n})
    return {
        "total_visits_including_events": total.get("total", 0),
        "total_events": total.get("total_events", 0),
        "total_visits": max(0, (total.get("total") or 0) - (total.get("total_events") or 0)),
        "days": days,
        "hourly": hourly_today,
    }


def week_start(d: datetime.date) -> datetime.date:
    # GoatCounter site setting: sunday_starts_week = false (Monday).
    return d - datetime.timedelta(days=d.weekday())


def rollup_weeks(days):
    buckets = defaultdict(int)
    for row in days:
        d = datetime.date.fromisoformat(row["day"])
        start = week_start(d)
        buckets[start] += row["visits"]
    out = []
    for start in sorted(buckets):
        end = start + datetime.timedelta(days=6)
        out.append({
            "start": start.isoformat(),
            "end": end.isoformat(),
            "label": f"{start.strftime('%b %-d')}–{end.strftime('%b %-d, %Y')}",
            "visits": buckets[start],
        })
    return out


def rollup_months(days):
    buckets = defaultdict(int)
    for row in days:
        d = datetime.date.fromisoformat(row["day"])
        key = d.replace(day=1)
        buckets[key] += row["visits"]
    out = []
    for start in sorted(buckets):
        out.append({
            "month": start.isoformat()[:7],
            "label": start.strftime("%B %Y"),
            "visits": buckets[start],
        })
    return out


def export_rows():
    """Individual pageviews via the export API. None if the once-an-hour limit is hit."""
    try:
        e = req("/export", "POST", {"format": "csv"})
        export_id = e.get("id")
        if export_id is None:
            print("export unavailable: no id", file=sys.stderr)
            return None
        for _ in range(30):
            time.sleep(4)
            st = req(f"/export/{export_id}")
            if st.get("finished_at") or st.get("error"):
                if st.get("error"):
                    print("export error:", st.get("error"), file=sys.stderr)
                    return None
                break
        data = req(f"/export/{export_id}/download", raw=True)
        try:
            data = gzip.decompress(data)
        except OSError:
            pass
        text = data.decode("utf-8-sig")
        rows = list(csv.DictReader(io.StringIO(text)))
        if not rows:
            print("export unavailable: 0 rows", file=sys.stderr)
            return None
        return rows
    except Exception as ex:
        print("export unavailable:", ex, file=sys.stderr)
        return None


def col(row, *names):
    for n in names:
        if n in row and row[n] != "":
            return row[n]
    # tolerate odd prefixes like "2Path"
    lower = {k.lower().lstrip("0123456789\ufeff "): k for k in row}
    for n in names:
        k = lower.get(n.lower())
        if k and row[k] != "":
            return row[k]
    return ""


def parse_export(rows):
    if not rows:
        return None
    visitors, arena, recruiter, sessions = [], [], [], {}
    first_flags = []
    locations_raw = defaultdict(int)
    for r in rows:
        path = col(r, "Path", "2Path")
        date = col(r, "Date", "Created At", "Time")
        session = col(r, "Session", "Session ID")
        first = col(r, "FirstVisit", "First Visit", "First")
        loc = col(r, "Location", "Loc")
        bot = col(r, "Bot")
        if bot and str(bot).strip() not in ("", "0", "false", "False"):
            continue
        if session:
            sessions.setdefault(session, {"first": first, "date": date, "path": path})
        if first != "":
            val = str(first).strip().lower()
            if val in ("1", "true", "t", "yes"):
                first_flags.append(True)
            elif val in ("0", "false", "f", "no"):
                first_flags.append(False)
        if loc:
            locations_raw[loc] += 1
        if "work-visitor/" in path:
            visitors.append({"name": urllib.parse.unquote(path.split("work-visitor/", 1)[1]), "time": date})
        elif "arena-player/" in path:
            arena.append({"name": urllib.parse.unquote(path.split("arena-player/", 1)[1]), "time": date})
        elif path.rstrip("/").endswith("recruiter-skip") or path.endswith("recruiter-skip"):
            recruiter.append({"time": date, "count": 1})
    unique = len(sessions)
    new = returning = None
    if sessions:
        new = sum(1 for s in sessions.values() if str(s.get("first")).strip().lower() in ("1", "true", "t", "yes"))
        # If FirstVisit is only on the session's first hit, sessions without a flag may still be returning
        if new == 0 and first_flags:
            # maybe first flags only on hits, not stored per session
            new = sum(1 for v in first_flags if v)
            returning = sum(1 for v in first_flags if not v)
        else:
            returning = max(0, unique - (new or 0)) if unique else 0
    # City-level: GoatCounter locations are typically ISO 3166-2 (US-OR), not cities.
    cities = []
    for loc, count in sorted(locations_raw.items(), key=lambda x: -x[1]):
        parts = loc.split("-")
        if len(parts) >= 3:
            cities.append({"name": loc, "count": count})
    return {
        "visitors": visitors,
        "arena_players": arena,
        "recruiter_skips": recruiter,
        "unique_visitors": unique,
        "new_visitors": new,
        "returning_visitors": returning,
        "cities": cities,
        "location_codes": [{"name": k, "count": v} for k, v in sorted(locations_raw.items(), key=lambda x: -x[1])],
    }


def build_range(key, all_days):
    start = range_start(key)
    start_day = start[:10]
    totals = totals_for(start)
    hits = fetch_hits(start)
    pages, visitors, arena_players, clicks, recruiter_events, recruiter_pages, planets = classify_hits(hits)
    referrers = named_rows("toprefs", start)
    countries = [{"name": (s.get("name") or s.get("id") or "(unknown)").strip() or "(unknown)", "count": s.get("count", 0)} for s in stat("locations", start) if s.get("count")]
    regions = location_regions(start)
    browsers = clean_rows(named_rows("browsers", start))
    for b in browsers:
        if b["name"] in ("", "(none)"):
            b["name"] = "(unknown)"
    systems = clean_rows(named_rows("systems", start))
    devices, screens = devices_and_screens(start)
    versions = browser_versions(start)
    rec_page_total = sum(r["count"] for r in recruiter_pages)
    rec_event_total = sum(r["count"] for r in recruiter_events)
    sources = source_rows(referrers, rec_page_total)
    # Filter the shared daily series to this range
    days = [d for d in all_days if d["day"] >= start_day]
    return {
        "start": start_day,
        "end": today_pt().isoformat(),
        "total_visits": sum(d["visits"] for d in days) if days else totals["total_visits"],
        "total_events": totals["total_events"],
        "total_visits_including_events": totals["total_visits_including_events"],
        "daily": days,
        "weekly": rollup_weeks(days),
        "monthly": rollup_months(days),
        "pages": pages,
        "planets": planets,
        "referrers": pretty_referrers(referrers),
        "sources": sources,
        "countries": countries,
        "regions": regions,
        "browsers": browsers,
        "browser_versions": versions,
        "systems": systems,
        "devices": devices,
        "screens": screens,
        "clicks": clicks,
        "click_total": sum(c["count"] for c in clicks),
        "recruiter_pages": recruiter_pages,
        "recruiter_page_hits": rec_page_total,
        "recruiter_skip_events": recruiter_events,
        "recruiter_skip_total": rec_event_total or rec_page_total,
        "named_visitor_count": sum(v.get("count") or 1 for v in visitors),
        "visitors_fallback": visitors,
        "arena_players_fallback": arena_players,
        "hourly": totals["hourly"] if key == "day" else [],
    }


def build_data(exported):
    all_totals = totals_for(PT_START)
    print("fetching all-time hits for daily adjustment", file=sys.stderr)
    all_hits = fetch_hits(PT_START)
    all_days = adjust_daily(all_totals["days"], all_hits)
    ranges = {}
    for key in ("day", "week", "month", "all"):
        print("building range", key, file=sys.stderr)
        ranges[key] = build_range(key, all_days)

    allr = ranges["all"]
    visitors = allr.pop("visitors_fallback")
    arena_players = allr.pop("arena_players_fallback")
    for key in ("day", "week", "month"):
        ranges[key].pop("visitors_fallback", None)
        ranges[key].pop("arena_players_fallback", None)

    unique = all_totals["total_visits"]
    new_vs = None
    cities = []
    cities_note = "GoatCounter does not provide city-level data. Regions and states are shown instead."
    if exported:
        if exported.get("visitors"):
            visitors = exported["visitors"]
        if exported.get("arena_players"):
            arena_players = exported["arena_players"]
        if exported.get("recruiter_skips") and not allr["recruiter_skip_events"]:
            # timestamps only; keep counts from API when present
            pass
        if exported.get("unique_visitors"):
            unique = exported["unique_visitors"]
        if exported.get("new_visitors") is not None and exported.get("returning_visitors") is not None:
            new_vs = {
                "new": exported["new_visitors"],
                "returning": exported["returning_visitors"],
                "unique": exported.get("unique_visitors") or unique,
            }
        if exported.get("cities"):
            cities = exported["cities"]
            cities_note = None
        elif exported.get("location_codes"):
            cities_note = "GoatCounter stores location as country and region codes, not cities. Those regions are listed below."

    visitors.sort(key=lambda v: v.get("time") or v.get("day") or "", reverse=True)
    arena_players.sort(key=lambda v: v.get("time") or v.get("day") or "", reverse=True)

    data = {
        "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "note": None,
        "timezone": "America/Los_Angeles",
        "tracking_started": START,
        "total_visits": allr["total_visits"],
        "total_events": allr["total_events"],
        "unique_visitors": unique,
        "unique_visitors_note": (
            "Unique visitors come from GoatCounter session IDs in the export."
            if exported and exported.get("unique_visitors")
            else "GoatCounter visits are unique sessions in the selected range, not raw pageviews."
        ),
        "new_vs_returning": new_vs,
        "daily": all_days,
        "weekly": rollup_weeks(all_days),
        "monthly": rollup_months(all_days),
        "today_hourly": all_totals["hourly"],
        "visitors": visitors,
        "arena_players": arena_players,
        "pages": allr["pages"],
        "planets": allr["planets"],
        "referrers": allr["referrers"],
        "sources": allr["sources"],
        "countries": allr["countries"],
        "regions": allr["regions"],
        "cities": cities,
        "cities_note": cities_note,
        "browsers": allr["browsers"],
        "browser_versions": allr["browser_versions"],
        "systems": allr["systems"],
        "devices": allr["devices"],
        "screens": allr["screens"],
        "clicks": allr["clicks"],
        "click_total": allr["click_total"],
        "recruiter_pages": allr["recruiter_pages"],
        "recruiter_page_hits": allr["recruiter_page_hits"],
        "recruiter_skip_events": allr["recruiter_skip_events"],
        "recruiter_skip_total": allr["recruiter_skip_total"],
        "ranges": ranges,
    }
    return data


def commit_and_push(repo, out_path, do_commit, do_push):
    if not do_commit and not do_push:
        return
    rel = "stats/data.json"
    # Always isolate pushes in a throwaway worktree of origin/main.
    if do_push:
        subprocess.run(["git", "-C", repo, "fetch", "-q", "origin", "main"], check=False)
        with tempfile.TemporaryDirectory(prefix="ghsite-stats-push-") as td:
            wt = os.path.join(td, "wt")
            subprocess.run(["git", "-C", repo, "worktree", "add", "--detach", wt, "origin/main"], check=True)
            dest = os.path.join(wt, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(out_path, "r", encoding="utf-8") as src, open(dest, "w", encoding="utf-8") as dst:
                dst.write(src.read())
            subprocess.run(["git", "-C", wt, "add", rel], check=True)
            st = subprocess.run(["git", "-C", wt, "diff", "--cached", "--quiet"])
            if st.returncode == 0:
                print("no change to push")
            else:
                subprocess.run(["git", "-C", wt, "commit", "-qm", "Update visitor stats"], check=True)
                subprocess.run(["git", "-C", wt, "push", "-q", "origin", "HEAD:main"], check=True)
                print("updated and pushed")
            subprocess.run(["git", "-C", repo, "worktree", "remove", "--force", wt], check=False)
        return
    if do_commit:
        subprocess.run(["git", "-C", repo, "add", rel], check=True)
        st = subprocess.run(["git", "-C", repo, "diff", "--cached", "--quiet"])
        if st.returncode == 0:
            print("no change")
            return
        subprocess.run(["git", "-C", repo, "commit", "-qm", "Update visitor stats"], check=True)
        print("committed locally")


def main():
    global TOKEN
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=os.environ.get("GHSITE_REPO", DEFAULT_REPO))
    parser.add_argument("--out", default=None)
    parser.add_argument("--no-commit", action="store_true", help="Write data.json only; do not commit or push")
    parser.add_argument("--push", action="store_true", help="Push stats/data.json to origin/main (default unless --no-commit)")
    parser.add_argument("--skip-export", action="store_true")
    args = parser.parse_args()
    out = args.out or os.path.join(args.repo, "stats", "data.json")
    TOKEN = load_token()

    exported = None if args.skip_export else parse_export(export_rows() or [])
    if exported and not any(exported.get(k) for k in ("visitors", "arena_players", "unique_visitors", "cities")):
        # empty parse
        if not exported.get("unique_visitors"):
            pass

    data = build_data(exported)
    old = json.load(open(out, encoding="utf-8")) if os.path.exists(out) else {}
    def strip(d):
        return {k: v for k, v in d.items() if k != "updated"}
    if old and strip(old) == strip(data):
        print("no change")
        return
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", out)
    if args.no_commit:
        return
    # Operational default: push stats/data.json to origin/main from a
    # throwaway worktree so other ghsite checkouts are left alone.
    commit_and_push(args.repo, out, do_commit=False, do_push=True)


if __name__ == "__main__":
    main()
