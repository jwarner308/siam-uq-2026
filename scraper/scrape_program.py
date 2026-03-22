#!/usr/bin/env python3
"""
Scrape the SIAM UQ 2026 conference program into a structured JSON file.

Usage:
    pip install requests beautifulsoup4
    python scrape_program.py
"""

import json
import re
import time
import sys
from collections import OrderedDict
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://meetings.siam.org"
PROGRAM_URL = f"{BASE_URL}/program.cfm?CONFCODE=uq26"
SESSION_URL = f"{BASE_URL}/sess/dsp_programsess.cfm?SESSIONCODE="
TALK_URL = f"{BASE_URL}/sess/dsp_talk.cfm?p="

OUTPUT_PATH = Path(__file__).parent.parent / "public" / "data" / "program.json"

# Be polite to the server
REQUEST_DELAY = 0.3  # seconds between requests
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "SIAM-UQ2026-ConfApp-Scraper/1.0 (conference scheduling app)"
})

DAY_MAP = {
    "Saturday": "2026-03-21",
    "Sunday": "2026-03-22",
    "Monday": "2026-03-23",
    "Tuesday": "2026-03-24",
    "Wednesday": "2026-03-25",
}


def fetch(url):
    """Fetch a URL with rate limiting and retries."""
    for attempt in range(3):
        try:
            time.sleep(REQUEST_DELAY)
            resp = SESSION.get(url, timeout=30)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            print(f"  Attempt {attempt + 1} failed for {url}: {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)
    print(f"  FAILED to fetch {url} after 3 attempts")
    return None


def parse_session_type(session_id):
    """Extract type prefix from session ID like MS1, CP5, IP3, MT1, SP1, PD1."""
    m = re.match(r"^([A-Z]+)", session_id)
    return m.group(1) if m else "OTHER"


def parse_program_page():
    """Parse the main program page into a structured list of days/timeslots/sessions."""
    print("Fetching main program page...")
    html = fetch(PROGRAM_URL)
    if not html:
        print("Failed to fetch program page!")
        sys.exit(1)

    soup = BeautifulSoup(html, "html.parser")

    days = OrderedDict()
    current_day_name = None
    current_date = None
    current_time_key = None

    # The program page has a table-like structure with day headers and session rows
    # We need to parse the HTML structure to extract sessions grouped by day and time

    # Find all the content - look for the main content area
    # SIAM uses a fairly simple HTML structure

    # Strategy: find all links to sessions (they contain SESSIONCODE) and
    # parse the surrounding context for day/time/location info

    # First, let's find day headers and session entries
    # The page typically has day headers followed by time blocks and session links

    content = soup.find("div", class_="container") or soup.find("body")

    # Look for all text content to parse the structure
    # We'll iterate through all elements to find day headers, time slots, and sessions

    all_rows = []

    # Find all table rows or div blocks that contain session info
    # SIAM pages typically use tables
    tables = soup.find_all("table")

    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            all_rows.append(row)

    # If no tables, try parsing from all text
    if not all_rows:
        # Fallback: parse all links with SESSIONCODE
        all_rows = [soup]

    # Parse all session links from the page
    session_links = soup.find_all("a", href=re.compile(r"SESSIONCODE=\d+"))

    # We need to understand the page structure better
    # Let's extract raw text blocks and session info

    # Get all text content and find patterns
    page_text = soup.get_text()

    # Parse sessions by finding patterns in the HTML
    # Each session entry typically has: day context, time, session ID + title, location

    # Let's build a simpler parser: go through the HTML and track context
    sessions_raw = []

    # Find all bold/header elements that indicate days
    day_pattern = re.compile(r"(Saturday|Sunday|Monday|Tuesday|Wednesday),\s+March\s+(\d+)")
    time_pattern = re.compile(r"(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))")
    session_id_pattern = re.compile(r"^((?:MS|CP|IP|MT|SP|PD|PP)\d+)")

    # Walk through all elements in order
    current_day = None
    current_time_start = None
    current_time_end = None

    # Get all text nodes in document order by iterating through elements
    for element in soup.descendants:
        if not hasattr(element, 'string') or element.string is None:
            text = element.get_text() if hasattr(element, 'get_text') else ""
        else:
            text = element.string

        if not text or not text.strip():
            continue

        text = text.strip()

        # Check for day header
        day_match = day_pattern.search(text)
        if day_match:
            current_day = day_match.group(1)
            current_date = DAY_MAP.get(current_day)
            continue

        # Check for time slot
        time_match = time_pattern.search(text)
        if time_match and current_day:
            current_time_start = time_match.group(1).strip()
            current_time_end = time_match.group(2).strip()

    # Better approach: find all session links and extract their context
    for link in session_links:
        href = link.get("href", "")
        code_match = re.search(r"SESSIONCODE=(\d+)", href)
        if not code_match:
            continue

        session_code = code_match.group(1)
        link_text = link.get_text(strip=True)

        # The link text typically contains the session ID and title
        # e.g., "MS1 Structure-informed UQ in ML"

        # Find the parent row/block to get time and location
        parent = link.find_parent("tr") or link.find_parent("div") or link.find_parent("p")
        if parent:
            parent_text = parent.get_text(" ", strip=True)
        else:
            parent_text = link_text

        # Search upward for day context
        day_text = ""
        ancestor = link
        for _ in range(20):
            ancestor = ancestor.parent
            if ancestor is None:
                break
            anc_text = ancestor.get_text() if hasattr(ancestor, 'get_text') else ""
            day_match = day_pattern.search(anc_text)
            if day_match:
                day_text = day_match.group(0)
                current_day = day_match.group(1)
                current_date = DAY_MAP.get(current_day)
                break

        sessions_raw.append({
            "code": session_code,
            "link_text": link_text,
            "parent_text": parent_text,
            "day": current_day,
            "date": current_date,
        })

    return sessions_raw


def parse_session_detail(session_code):
    """Fetch and parse a session detail page to get talks."""
    url = f"{SESSION_URL}{session_code}"
    html = fetch(url)
    if not html:
        return None

    soup = BeautifulSoup(html, "html.parser")
    page_text = soup.get_text()

    result = {
        "title": "",
        "time": "",
        "date": "",
        "location": "",
        "organizers": [],
        "chair": "",
        "talks": [],
        "cancelled": False,
    }

    # Extract session title - usually in a header or bold
    # Look for the main title
    title_el = soup.find("h2") or soup.find("h3") or soup.find("h4")
    if title_el:
        title_text = title_el.get_text(strip=True)
        # Strip session ID prefix (e.g., "MS1" or "CANCELLED: MS42")
        title_text = re.sub(
            r"^(?:CANCELLED:\s*)?(?:MS|CP|IP|MT|SP|PD|PP)\d+\s*",
            "",
            title_text,
        ).strip()
        title_text = re.sub(r"^[\s:.\-–]+", "", title_text)
        result["title"] = title_text

    # Check for cancellation - look for "CANCELLED" in the title element only
    if title_el and "CANCELLED" in title_el.get_text().upper():
        result["cancelled"] = True

    # Extract date, time, location from the page text
    time_pattern = re.compile(r"(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))")
    time_match = time_pattern.search(page_text)
    if time_match:
        result["time"] = f"{time_match.group(1).strip()} - {time_match.group(2).strip()}"

    day_pattern = re.compile(r"(Sunday|Monday|Tuesday|Wednesday|Saturday),\s+March\s+(\d+)")
    day_match = day_pattern.search(page_text)
    if day_match:
        day_name = day_match.group(1)
        result["date"] = DAY_MAP.get(day_name, "")

    # Location - look for common room names
    loc_pattern = re.compile(
        r"((?:Nicollet Ballroom|Regency Room|Mirage Room|Lakeshore [A-Z]|"
        r"Minnehaha|Greenway [A-Z]|Skyway|Northstar Ballroom)"
        r"(?:\s*[-–]\s*(?:Main Level|2nd Level|Second Level))?)"
    )
    loc_match = loc_pattern.search(page_text)
    if loc_match:
        result["location"] = loc_match.group(1).strip()

    # Extract organizers
    org_pattern = re.compile(r"Organizer[s]?[:\s]+(.+?)(?:\n|$)", re.IGNORECASE)
    org_match = org_pattern.search(page_text)
    if org_match:
        org_text = org_match.group(1)
        # Split by common separators
        orgs = re.split(r"\s+and\s+|,\s*", org_text)
        result["organizers"] = [o.strip() for o in orgs if o.strip()]

    # Extract chair
    chair_pattern = re.compile(r"Chair[:\s]+(.+?)(?:\n|$)", re.IGNORECASE)
    chair_match = chair_pattern.search(page_text)
    if chair_match:
        result["chair"] = chair_match.group(1).strip()

    # Extract talks using the <dt>/<dd> structure:
    #   <dt><strong>TIME TITLE</strong> <a href="dsp_talk.cfm?p=ID">abstract</a></dt>
    #   <dd><em>Speaker</em>, Affiliation</dd>
    talk_links = soup.find_all("a", href=re.compile(r"dsp_talk\.cfm\?p=(\d+)"))

    seen_talk_ids = set()
    for talk_link in talk_links:
        href = talk_link.get("href", "")
        talk_id_match = re.search(r"p=(\d+)", href)
        if not talk_id_match:
            continue

        talk_id = talk_id_match.group(1)
        if talk_id in seen_talk_ids:
            continue
        seen_talk_ids.add(talk_id)

        talk_info = {
            "id": talk_id,
            "title": "",
            "time": "",
            "speakers": [],
            "abstract": "",
        }

        # The title is in the <strong> sibling/parent of the abstract link
        # Look for <strong> in the same <dt> or preceding sibling
        dt = talk_link.find_parent("dt")
        if dt:
            strong = dt.find("strong")
            if strong:
                strong_text = strong.get_text(strip=True)
                # Extract time prefix (e.g., "4:30-4:45") and title
                time_match = re.match(
                    r"(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*(.*)",
                    strong_text,
                    re.DOTALL,
                )
                if time_match:
                    talk_info["time"] = f"{time_match.group(1)}-{time_match.group(2)}"
                    talk_info["title"] = time_match.group(3).strip()
                else:
                    talk_info["title"] = strong_text

            # Speaker info is in the next <dd> sibling
            dd = dt.find_next_sibling("dd")
            if not dd:
                # Sometimes dd is a child (malformed HTML)
                dd = dt.find_next("dd")
            if dd:
                dd_text = dd.get_text(strip=True)
                # Parse speaker(s) from dd text
                # Format: "Name1, Affiliation1; Name2, Affiliation2" or
                # "Name1 and Name2, Affiliation"
                # Split by common patterns
                # Remove "and" connectors between co-authors
                speaker_text = dd_text
                # Split on patterns like "; " or " and " between speakers
                # But be careful: "Name, Univ, Country" uses commas within one speaker
                # The SIAM format typically has: "Name, Affiliation, Country"
                # with "and" or ";" separating multiple speakers
                parts = re.split(r"\s+and\s+|\s*;\s*", speaker_text)
                for part in parts:
                    part = part.strip()
                    if not part or len(part) < 3:
                        continue
                    # Split on first comma for name vs affiliation
                    comma_idx = part.find(",")
                    if comma_idx > 0:
                        name = part[:comma_idx].strip()
                        affiliation = part[comma_idx + 1:].strip()
                    else:
                        name = part
                        affiliation = ""
                    # Filter out noise
                    if name and len(name) < 100 and not any(
                        kw in name.lower()
                        for kw in ["cancelled", "session", "organizer", "chair", "room"]
                    ):
                        talk_info["speakers"].append({
                            "name": name,
                            "affiliation": affiliation,
                        })
        else:
            # Fallback: try to find title from preceding <strong>
            strong = talk_link.find_previous_sibling("strong") or talk_link.find_previous("strong")
            if strong:
                strong_text = strong.get_text(strip=True)
                time_match = re.match(
                    r"(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*(.*)",
                    strong_text,
                    re.DOTALL,
                )
                if time_match:
                    talk_info["time"] = f"{time_match.group(1)}-{time_match.group(2)}"
                    talk_info["title"] = time_match.group(3).strip()
                else:
                    talk_info["title"] = strong_text

        # If we still don't have a title, skip
        if not talk_info["title"] or talk_info["title"].lower() == "abstract":
            continue

        result["talks"].append(talk_info)

    return result


def fetch_abstract(talk_id):
    """Fetch the abstract text for a talk."""
    url = f"{TALK_URL}{talk_id}"
    html = fetch(url)
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")

    # The abstract is typically in a paragraph or div after the title/speaker info
    # Look for the main content block
    page_text = soup.get_text("\n", strip=True)

    # Try to extract just the abstract portion
    # It usually comes after speaker/affiliation info and before navigation links

    # Look for "Abstract:" label or similar
    abstract_match = re.search(
        r"(?:Abstract[:\s]*\n?)(.*?)(?:\n\s*(?:Conference|Session|Program|Contact|©))",
        page_text,
        re.DOTALL | re.IGNORECASE,
    )
    if abstract_match:
        return abstract_match.group(1).strip()

    # Fallback: try to find a content div/paragraph that looks like an abstract
    # (longer text block, not navigation)
    paragraphs = soup.find_all("p")
    best = ""
    for p in paragraphs:
        text = p.get_text(strip=True)
        if len(text) > len(best) and len(text) > 50:
            # Skip navigation/boilerplate
            if not any(kw in text.lower() for kw in ["contact meetings@", "program home", "copyright"]):
                best = text

    return best


def build_program():
    """Main function: scrape everything and build the JSON."""
    print("=" * 60)
    print("SIAM UQ 2026 Conference Program Scraper")
    print("=" * 60)

    # Step 1: Parse the main program page to get all sessions
    sessions_raw = parse_program_page()
    print(f"\nFound {len(sessions_raw)} session links on program page")

    # Step 2: Fetch details for each session
    program = {
        "conference": {
            "name": "2026 SIAM Conference on Uncertainty Quantification (UQ26)",
            "dates": "March 21-25, 2026",
            "location": "Hyatt Regency Minneapolis, Minneapolis, Minnesota, U.S.",
        },
        "days": [],
    }

    # Group sessions by day and time
    day_sessions = OrderedDict()

    total = len(sessions_raw)
    for i, raw in enumerate(sessions_raw):
        code = raw["code"]
        link_text = raw["link_text"]

        # Extract session ID from link text
        id_match = re.match(r"^((?:MS|CP|IP|MT|SP|PD|PP)\d+)\b", link_text)
        session_id = id_match.group(1) if id_match else link_text[:10]
        session_type = parse_session_type(session_id)

        # Get the title (everything after the ID)
        if id_match:
            title = link_text[len(id_match.group(0)):].strip()
            # Remove leading punctuation
            title = re.sub(r"^[\s:.\-–]+", "", title)
        else:
            title = link_text

        print(f"\n[{i+1}/{total}] Fetching {session_id}: {title[:50]}...")

        detail = parse_session_detail(code)
        if not detail:
            print(f"  Skipped (fetch failed)")
            continue

        # Use detail title if we got a better one
        if detail["title"] and len(detail["title"]) > len(title):
            title = detail["title"]

        # Fetch abstracts for each talk
        for talk in detail["talks"]:
            if talk["id"]:
                print(f"  Fetching abstract for talk {talk['id']}...")
                talk["abstract"] = fetch_abstract(talk["id"])

        date = detail["date"] or raw.get("date", "")
        time_str = detail["time"] or ""

        if not date:
            print(f"  Warning: no date found for {session_id}")
            continue

        session_entry = {
            "id": session_id,
            "code": code,
            "title": title,
            "type": session_type,
            "location": detail["location"],
            "organizers": detail["organizers"],
            "chair": detail["chair"],
            "cancelled": detail["cancelled"],
            "talks": detail["talks"],
        }

        # Group by day → time
        if date not in day_sessions:
            day_sessions[date] = OrderedDict()

        if time_str not in day_sessions[date]:
            day_sessions[date][time_str] = []

        day_sessions[date][time_str].append(session_entry)

    # Step 3: Build the final structure
    day_labels = {
        "2026-03-21": "Saturday, March 21",
        "2026-03-22": "Sunday, March 22",
        "2026-03-23": "Monday, March 23",
        "2026-03-24": "Tuesday, March 24",
        "2026-03-25": "Wednesday, March 25",
    }

    for date in sorted(day_sessions.keys()):
        time_slots = []
        for time_str, sessions in day_sessions[date].items():
            # Parse start/end from time string
            time_match = re.match(
                r"(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))",
                time_str,
            )
            start = time_match.group(1).strip() if time_match else time_str
            end = time_match.group(2).strip() if time_match else ""

            time_slots.append({
                "start": start,
                "end": end,
                "sessions": sessions,
            })

        program["days"].append({
            "date": date,
            "label": day_labels.get(date, date),
            "timeSlots": time_slots,
        })

    # Step 4: Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(program, f, indent=2, ensure_ascii=False)

    # Print summary
    total_sessions = sum(
        len(s) for d in day_sessions.values() for s in d.values()
    )
    total_talks = sum(
        len(sess["talks"])
        for d in day_sessions.values()
        for sessions in d.values()
        for sess in sessions
    )

    print(f"\n{'=' * 60}")
    print(f"Done! Scraped {total_sessions} sessions with {total_talks} talks")
    print(f"Output: {OUTPUT_PATH}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    build_program()
