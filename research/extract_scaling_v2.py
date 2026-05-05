#!/usr/bin/env python3
"""
Unified Table A3 parser for UAC Scaling Reports (2007-2025).

Handles ALL format variants and edge cases:
  - 3-line old format (2007-2009): HSC line -> course name line -> scaled line
  - HSC/scaled format (2010-2023): course + number + "HSC" + values on one line
  - hsc/sca format (2024-2025): course + number + "hsc" + values on one line
  - Small courses (<40 students): no percentile data, only mean/sd/max
  - Multi-line course names (e.g., "Information Processes & \n Technology")
  - Courses with numbers in names (e.g., "Music 1", "Mathematics Standard 2")
  - Courses that span page breaks (form feeds)

Output: JSON with {year: [course_objects]} where each course has:
  course, number, hsc{mean, sd, max, p99, p90, p75, p50, p25},
  scaled{mean, sd, max, p99, p90, p75, p50, p25}
  Missing percentiles stored as null.
"""

import subprocess
import json
import os
import re
from typing import Optional


BASE_DIR = "/Users/matthew/how does scaling work/hsc-truth-engine/research"
DATA_DIR = f"{BASE_DIR}/scaling-data"

# Year -> (pdf_path, layout_path, format)
# format: "new_lower" = hsc/sca, "new_upper" = HSC/scaled, "old" = 3-line
YEAR_CONFIG = {}

for y in range(2025, 2023, -1):
    YEAR_CONFIG[y] = ("new_lower", f"{DATA_DIR}/scaling-report-{y}-preliminary.pdf")
# 2024 has a special filename
YEAR_CONFIG[2024] = ("new_lower", f"{BASE_DIR}/scaling-report-2024-nsw-hsc.pdf")
for y in range(2023, 2009, -1):
    YEAR_CONFIG[y] = ("new_upper", f"{DATA_DIR}/scaling-report-{y}.pdf")
for y in range(2009, 2006, -1):
    YEAR_CONFIG[y] = ("old", f"{DATA_DIR}/scaling-report-{y}.pdf")


def extract_text(pdf_path: str) -> str:
    """Extract layout-preserving text from a PDF using pdftotext."""
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"pdftotext failed: {result.stderr}")
    return result.stdout


def load_or_extract_text(year: int) -> str:
    """Load cached layout.txt if available, otherwise extract from PDF."""
    # Try layout files
    if year == 2024:
        cache_path = f"{BASE_DIR}/scaling-report-{year}-nsw-hsc-layout.txt"
    elif year == 2025:
        cache_path = f"{DATA_DIR}/scaling-report-{year}-layout.txt"
    else:
        cache_path = f"{DATA_DIR}/scaling-report-{year}-layout.txt"

    if os.path.exists(cache_path):
        with open(cache_path) as f:
            return f.read()

    # Extract from PDF
    _, pdf_path = YEAR_CONFIG.get(year, (None, None))
    if pdf_path and os.path.exists(pdf_path):
        text = extract_text(pdf_path)
        # Cache it
        with open(cache_path, "w") as f:
            f.write(text)
        return text

    raise FileNotFoundError(f"No text or PDF for {year}")


def find_table_a3_section(text: str) -> str:
    """
    Find the actual Table A3 data section (skip TOC entries).
    Returns the text from the first "Notes:" after Table A3 header
    to the Table A4 marker.
    """
    start = None
    pos = 0
    while True:
        idx = text.find("Table A3 Descriptive", pos)
        if idx == -1:
            break
        # Check if this is the actual table (has "Notes:" nearby)
        after = text[idx:idx + 800]
        if "Notes:" in after and ("Number" in after or "Course" in after):
            start = idx
            break
        pos = idx + 10

    if start is None:
        return ""

    # Find end: Table A4 (but not "Table A4 Descriptive" which is TOC)
    end = len(text)
    pos = start + 1
    while pos < len(text):
        idx = text.find("Table A4", pos)
        if idx == -1:
            break
        # Check it's not "Table A4 Descriptive" (TOC faux entry)
        nearby = text[idx:idx + 30]
        if "Descriptive" not in nearby[:25]:
            end = idx
            break
        pos = idx + 10

    return text[start:end]


def split_value_parts(parts: list[str], start_idx: int, max_count: int = 8) -> list[Optional[float]]:
    """Extract up to max_count float values from parts starting at start_idx.
    Returns list with None for missing values."""
    values = []
    for i in range(max_count):
        idx = start_idx + i
        if idx < len(parts):
            try:
                values.append(float(parts[idx].replace(",", "")))
            except (ValueError, AttributeError):
                values.append(None)
        else:
            values.append(None)
    return values


def build_stats_dict(vals: list[Optional[float]]) -> dict:
    """Convert value list to stats dict."""
    keys = ["mean", "sd", "max", "p99", "p90", "p75", "p50", "p25"]
    return {k: v for k, v in zip(keys, vals)}


def parse_new_format(section: str, hsc_marker: str, scaled_marker: str) -> list[dict]:
    """
    Parse new format (2010-2025): course name + number + hsc_marker + values all on one line.
    hsc_marker: "hsc" (2024-25 lowercase) or "HSC" (2010-2023 uppercase)
    scaled_marker: "sca" or "scaled"
    """
    lines = section.split("\n")
    courses = []
    current = None

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Skip headers, notes, page markers
        if any(s in stripped for s in [
            "Table A3", "Descriptive", "Type of", "Course  ",
            "(i)", "(ii)", "(iii)", "(iv)", "Appendix", "Notes:",
            "Number", "Mean", "max", "percentiles",
        ]):
            continue
        if re.match(r"^\d{1,3}$", stripped):  # page numbers
            continue

        parts = stripped.split()

        # --- Check for scaled continuation line ---
        if scaled_marker in parts:
            si = parts.index(scaled_marker)
            # Check if there's a name continuation BEFORE the scaled marker
            name_prefix = " ".join(parts[:si]).strip()
            if name_prefix and current is not None:
                # This line has BOTH name continuation AND scaled data
                current["course"] += " " + name_prefix

            if current is not None:
                vals = split_value_parts(parts, si + 1, 8)
                current["scaled"] = build_stats_dict(vals)
                courses.append(current)
                current = None
            continue

        # --- Check if this is a name continuation line ---
        # (no hsc_marker, no scaled_marker, no digit sequences >= 10, just text)
        if current is not None and hsc_marker not in parts:
            has_number = any(
                p.replace(",", "").isdigit() and int(p.replace(",", "")) >= 10
                for p in parts
            )
            # Skip single-character artifact lines (ghost chars from adjacent columns)
            is_artifact = (len(parts) == 1 and len(parts[0]) <= 2)
            if not has_number and not any(p.lower() in ("hsc", "sca", "scaled") for p in parts) and not is_artifact:
                # Append to course name
                current["course"] += " " + stripped
            continue

        # --- Check for HSC/hsc line ---
        if hsc_marker not in parts:
            continue

        hi = parts.index(hsc_marker)

        # Find student count (number >= 10 before hsc_marker)
        num_idx = -1
        num_val = 0
        for j, p in enumerate(parts[:hi]):
            cleaned = p.replace(",", "")
            if cleaned.isdigit() and int(cleaned) >= 10:
                num_idx = j
                num_val = int(cleaned)
                break

        if num_idx < 0:
            continue

        course_name = " ".join(parts[:num_idx]).strip()
        if not course_name:
            continue

        # Extract values after hsc marker
        vals = split_value_parts(parts, hi + 1, 8)

        current = {
            "course": course_name,
            "number": num_val,
            "hsc": build_stats_dict(vals),
        }

    # Don't forget last course if it has no scaled data (shouldn't happen but be safe)
    if current is not None:
        courses.append(current)

    return courses


def parse_old_format(section: str) -> list[dict]:
    """
    Parse old 3-line format (2007-2009):
      Line 1: HSC mean sd max p99 p90 p75 p50 p25
      Line 2: Course Name    NUMBER
      Line 3: scaled mean sd max p99 p90 p75 p50 p25
    """
    lines = section.split("\n")
    courses = []
    pending_hsc = None
    pending_course = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if any(s in stripped for s in [
            "Table A3", "Descriptive", "(i)", "(ii)", "(iii)",
            "Course  ", "Type of", "Number  ", "Appendix",
        ]):
            continue
        if re.match(r"^\d{1,3}$", stripped):
            continue

        parts = stripped.split()

        # HSC line: starts with "HSC" followed by values
        if parts[0] == "HSC" and len(parts) >= 4:
            vals = split_value_parts(parts, 1, 8)
            pending_hsc = build_stats_dict(vals)
            pending_course = None
            continue

        # Scaled line
        if parts[0].lower() == "scaled" and len(parts) >= 4:
            if pending_hsc is not None and pending_course is not None:
                vals = split_value_parts(parts, 1, 8)
                courses.append({
                    "course": pending_course["name"],
                    "number": pending_course["number"],
                    "hsc": pending_hsc,
                    "scaled": build_stats_dict(vals),
                })
            pending_hsc = None
            pending_course = None
            continue

        # If we have pending HSC data, this should be a course name + number line
        if pending_hsc is not None:
            # Find a number >= 100
            num_idx = -1
            for j, p in enumerate(parts):
                cleaned = p.replace(",", "").replace(" ", "")
                if cleaned.isdigit() and int(cleaned) >= 100:
                    num_idx = j
                    break

            if num_idx >= 0 and num_idx > 0:
                course_name = " ".join(parts[:num_idx])
                number = int(parts[num_idx].replace(",", ""))
                if course_name:
                    pending_course = {"name": course_name, "number": number}

    return courses


def detect_format(section: str) -> tuple[str, str]:
    """
    Detect the format variant by examining actual data lines (skip headers).
    Returns (hsc_marker, scaled_marker) or raises ValueError.
    """
    lines = section.split("\n")
    data_lines = []
    in_data = False

    for line in lines:
        s = line.strip()
        if not s:
            continue
        # Skip header/note lines
        if any(skip in s for skip in [
            "Table A3", "Descriptive", "Notes:", "(i)", "(ii)", "(iii)", "(iv)",
            "Type of", "Course  ", "Number", "Mean", "max", "percentiles",
        ]):
            continue
        if re.match(r"^\d{1,3}$", s):
            continue

        data_lines.append(s)
        if len(data_lines) >= 10:
            break

    # Check for old 3-line format (starts with "HSC" on its own line)
    for dl in data_lines[:5]:
        if dl.startswith("HSC ") and len(dl.split()) >= 4:
            return ("HSC", "scaled")  # old format marker — caller will use parse_old_format

    # Check for lowercase hsc/sca (2024-2025)
    lower_hsc = sum(1 for dl in data_lines if " hsc " in dl or dl.split() and dl.split()[0] == "hsc")
    lower_sca = sum(1 for dl in data_lines if " sca " in dl or dl.split() and dl.split()[0] == "sca")
    upper_hsc = sum(1 for dl in data_lines if " HSC " in dl)
    upper_scaled = sum(1 for dl in data_lines if " scaled " in dl.lower() or (dl.split() and dl.split()[0].lower() == "scaled"))

    if lower_hsc > 0 and lower_sca > 0:
        return ("hsc", "sca")
    elif upper_hsc > 0:
        return ("HSC", "scaled")
    elif lower_hsc > 0:
        return ("hsc", "sca")
    else:
        # Fallback: try both
        return ("hsc", "sca")


def parse_table_a3(text: str) -> list[dict]:
    """Parse Table A3, auto-detecting the format."""
    section = find_table_a3_section(text)
    if not section:
        return []

    hsc_marker, scaled_marker = detect_format(section)

    # Check for old 3-line format
    for line in section.split("\n")[:30]:
        s = line.strip()
        if s.startswith("HSC ") and len(s.split()) >= 4 and "Course" not in s:
            return parse_old_format(section)

    return parse_new_format(section, hsc_marker, scaled_marker)


def extract_all() -> dict:
    """Extract Table A3 for all available years."""
    all_data = {}

    for year in sorted(YEAR_CONFIG.keys(), reverse=True):
        try:
            text = load_or_extract_text(year)
            courses = parse_table_a3(text)
            all_data[str(year)] = {"table_a3": courses}
            with_scaled = sum(1 for c in courses if c.get("scaled"))
            small = sum(1 for c in courses if c["number"] < 40)
            print(f"  {year}: {len(courses)} courses ({with_scaled} with scaled, {small} small)")
        except Exception as e:
            print(f"  {year}: ERROR — {e}")

    return all_data


def main():
    import sys

    years_arg = [int(a) for a in sys.argv[1:] if a.isdigit()]

    if years_arg:
        years = sorted(years_arg, reverse=True)
    else:
        years = sorted(YEAR_CONFIG.keys(), reverse=True)

    print(f"Extracting years: {years}")
    print()

    all_data = {}
    for year in years:
        print(f"Processing {year}...")
        try:
            text = load_or_extract_text(year)
            courses = parse_table_a3(text)
            all_data[str(year)] = {"table_a3": courses}

            with_scaled = sum(1 for c in courses if c.get("scaled"))
            without = sum(1 for c in courses if not c.get("scaled"))
            small = sum(1 for c in courses if c["number"] < 40)
            print(f"  -> {len(courses)} courses: {with_scaled} with scaled, "
                  f"{without} without, {small} small (<40 students)")

            # Show small courses
            if small > 0:
                for c in courses:
                    if c["number"] < 40:
                        has_pct = c["hsc"].get("p99") is not None
                        print(f"     • {c['course']}: {c['number']} students"
                              f"{' (no percentiles)' if not has_pct else ''}")

        except Exception as e:
            print(f"  -> ERROR: {e}")
            import traceback
            traceback.print_exc()

    # Write output to a NEW file (don't overwrite existing)
    output_path = f"{BASE_DIR}/scaling-data/scaling-v2-output.json"
    with open(output_path, "w") as f:
        json.dump(all_data, f, indent=2)

    print(f"\nSaved to {output_path}")
    print("Existing files NOT modified.")


if __name__ == "__main__":
    main()
