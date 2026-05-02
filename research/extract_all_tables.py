#!/usr/bin/env python3
"""Extract Tables A1, A2, A3, A7, A8, A9 from UAC Scaling Reports.
Uses pdftotext -layout output, auto-detects format differences between years."""

import subprocess
import json
import os
import re

BASE_DIR = "/Users/matthew/how does scaling work"
YEARS = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]


def load_text(year):
    if year == 2024:
        path = f"{BASE_DIR}/scaling-report-2024-nsw-hsc-layout.txt"
    else:
        path = f"{BASE_DIR}/scaling-data/scaling-report-{year}-layout.txt"
    with open(path) as f:
        return f.read()


def parse_table_a3(text):
    """Parse Table A3: descriptive statistics for HSC and scaled marks."""
    # Find A3 section: find the first occurrence that has "Notes:" (actual table, not TOC)
    start = None
    pos = 0
    while True:
        idx = text.find("Table A3 Descriptive", pos)
        if idx == -1:
            break
        after = text[idx:idx + 600]
        if "Notes:" in after:
            start = idx
            break
        pos = idx + 10
    if start is None:
        return []

    # Find end: next "Appendix – Table A4" or "Table A4 Distributions"
    end = len(text)
    for pattern in ["\nAppendix – Table A4", "\nTable A4 Distributions"]:
        idx = text.find(pattern, start + 1)
        if idx != -1:
            end = idx
            break

    section = text[start:end]
    lines = section.split("\n")

    # Auto-detect format from first course data line (has number >= 100 then hsc/HSC)
    format_code = None  # 0 = HSC/scaled, 1 = hsc/sca
    for line in lines:
        s = line.strip()
        if not s:
            continue
        parts = s.split()
        # Need at least: course_name..., NUMBER, hsc/HSC, mean, sd, max, p99...
        # Find a number >= 100 followed by hsc or HSC
        for j, p in enumerate(parts):
            cleaned = p.replace(",", "")
            if cleaned.isdigit() and int(cleaned) >= 100:
                if j + 1 < len(parts):
                    if parts[j + 1] == "HSC":
                        format_code = 0
                        break
                    elif parts[j + 1] == "hsc":
                        format_code = 1
                        break
        if format_code is not None:
            break

    if format_code is None:  # fallback
        format_code = 0

    courses = []
    current = None
    # Track orphan lines that might be course name continuations
    orphan_name = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip headers, notes, page numbers
        if any(skip in stripped for skip in [
            "Table A3", "Descriptive", "Type of", "Course  ",
            "(i)", "(ii)", "(iii)", "(iv)", "Appendix", "Notes:"
        ]):
            continue
        if re.match(r"^\d{1,3}$", stripped):  # page numbers
            continue

        parts = stripped.split()

        if format_code == 0:
            # HSC/scaled format (2020-2023)
            hsc_marker = "HSC"
            scaled_marker = "scaled"
        else:
            # hsc/sca format (2024)
            hsc_marker = "hsc"
            scaled_marker = "sca"

        # Check for scaled continuation line
        if scaled_marker in parts and len(parts) >= 8:
            si = parts.index(scaled_marker)
            if current is not None:
                try:
                    vals = [parts[si + j] for j in range(1, 9)]
                    current["scaled"] = {
                        "mean": float(vals[0]),
                        "sd": float(vals[1]),
                        "max": float(vals[2]),
                        "p99": float(vals[3]),
                        "p90": float(vals[4]),
                        "p75": float(vals[5]),
                        "p50": float(vals[6]),
                        "p25": float(vals[7]),
                    }
                    courses.append(current)
                    current = None
                except (ValueError, IndexError):
                    pass
            continue

        # Check for HSC/hsc line
        if hsc_marker in parts and len(parts) >= 10:
            hi = parts.index(hsc_marker)
            if hi < 1:
                continue

            # Find number: integer digit before hsc_marker, >= 100 (student count)
            num_str = ""
            num_idx = -1
            for j, p in enumerate(parts[:hi]):
                cleaned = p.replace(",", "")
                if cleaned.isdigit() and int(cleaned) >= 100:
                    num_str = p
                    num_idx = j
                    break

            if not num_str or num_idx < 0:
                continue

            course_name = " ".join(parts[:num_idx]).strip()
            if not course_name:
                continue

            number = int(num_str.replace(",", ""))
            vals = parts[hi + 1: hi + 9]

            try:
                current = {
                    "course": course_name,
                    "number": number,
                    "hsc": {
                        "mean": float(vals[0]),
                        "sd": float(vals[1]),
                        "max": float(vals[2]),
                        "p99": float(vals[3]),
                        "p90": float(vals[4]),
                        "p75": float(vals[5]),
                        "p50": float(vals[6]),
                        "p25": float(vals[7]),
                    },
                }
            except (ValueError, IndexError):
                current = None
            continue

    # Fix known line-wrap truncation issues in course names
    name_fixes = {
        "Information Processes &": "Information Processes & Technology",
        "Information & Digital Technology": "Information & Digital Technology Exam",
    }
    for c in courses:
        if c["course"] in name_fixes:
            c["course"] = name_fixes[c["course"]]

    return courses


def parse_table_a9(text):
    """Parse Table A9: ATAR to aggregate mapping."""
    # Find actual table (has "Note:" and "Lowest aggregate", not TOC)
    import re as _re
    start = None
    pos = 0
    while True:
        m = _re.search(r"Table\s+A9\s+Relationship\s+between", text[pos:])
        idx = pos + m.start() if m else -1
        if idx == -1:
            break
        after = text[idx:idx + 400]
        if "Note" in after and ("Lowest aggregate" in after or "lowest aggregate" in after):
            start = idx
            break
        pos = idx + 10
    if start is None:
        return []

    end = len(text)
    # Look for end marker (page number + end of document)
    section = text[start:start + 3000]

    lines = section.split("\n")
    mappings = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(skip in stripped for skip in [
            "Table A9", "Lowest aggregate", "Note", "(i)", "aggregates",
            "Relationship between", "ATAR and"
        ]):
            continue

        parts = stripped.split()
        if len(parts) < 2:
            continue

        try:
            atar = float(parts[0])
            if not (30.00 <= atar <= 99.95):
                continue
        except ValueError:
            continue

        # Parse all aggregate columns (years)
        aggs = []
        for p in parts[1:]:
            try:
                aggs.append(float(p))
            except ValueError:
                break

        if aggs:
            mappings.append({"atar": atar, "aggregates": aggs})

    return mappings


def parse_table_a7(text):
    """Parse Table A7: ATAR distribution."""
    # Find the actual data table (followed by "Note:", not a TOC entry)
    start = None
    for pattern in [
        "Table A7 ATAR distribution\nNote:",
    ]:
        idx = text.find(pattern)
        if idx != -1:
            start = idx
            break
    if start is None:
        for pattern in [
            "Table A7 ATAR distribution",
        ]:
            idx = text.find(pattern)
            if idx == -1:
                continue
            # Skip if this is a TOC entry (has no newline before next text)
            after = text[idx:idx + 200]
            if "Note:" in after:
                start = idx
                break
    if start is None:
        return []

    # Find data start (after header)
    section = text[start:start + 4000]
    lines = section.split("\n")
    distribution = []
    in_data = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if "Table A7" in stripped or "ATAR distribution" in stripped:
            continue
        if any(skip in stripped for skip in [
            "Number on", "Percentage", "Note", "(i)", "median", "ATAR  "
        ]):
            continue

        # Data lines: "99.95  51  51  0.1"
        parts = stripped.split()
        if len(parts) >= 3:
            try:
                atar = float(parts[0])
                if 30.00 <= atar <= 99.95:
                    number = int(parts[1].replace(",", ""))
                    cumulative = int(parts[2].replace(",", ""))
                    percentage = float(parts[3]) if len(parts) >= 4 else 0
                    distribution.append({
                        "atar": atar,
                        "count": number,
                        "cumulative_count": cumulative,
                        "cumulative_percent": percentage,
                    })
            except (ValueError, IndexError):
                continue

    return distribution


def parse_table_a8(text):
    """Parse Table A8: ATAR percentiles 2020-2024."""
    start = None
    pos = 0
    while True:
        idx = text.find("Table A8 ATAR percentiles:", pos)
        if idx == -1:
            break
        after = text[idx:idx + 500]
        if "Note:" in after and "percentile" in after.lower():
            start = idx
            break
        pos = idx + 10
    if start is None:
        return []

    section = text[start:start + 3000]
    # Truncate at A9 table if it appears in this section
    a9_idx = section.find("\nTable A9")
    if a9_idx != -1:
        section = section[:a9_idx]
    lines = section.split("\n")
    percentiles = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(skip in stripped for skip in [
            "Table A8", "ATAR percentiles", "Percentile", "Note", "(i)"
        ]):
            continue

        parts = stripped.split()
        if len(parts) >= 2:
            try:
                pct = float(parts[0])
                if 0 <= pct <= 100:
                    atars = []
                    for p in parts[1:]:
                        try:
                            v = float(p)
                            # A8 values are ATARs (30-99.95), not aggregates (>100)
                            if v > 100:
                                break
                            atars.append(v)
                        except ValueError:
                            break
                    if atars:
                        percentiles.append({
                            "percentile": pct,
                            "atars": atars,
                        })
            except ValueError:
                continue

    return percentiles


def parse_table_a2(text):
    """Parse Table A2: HSC mark distributions (band percentages)."""
    start = None
    # Find actual Table A2 (not TOC entry) - looks for "Table A2 Distributions" with Note: nearby
    pos = 0
    while True:
        idx = text.find("Table A2 Distributions of", pos)
        if idx == -1:
            break
        # Check if followed by note content (actual table), not just TOC
        after = text[idx:idx + 600]
        if "Note" in after and ("Percentage" in after or "band" in after.lower()):
            start = idx
            break
        pos = idx + 10
    if start is None:
        return []

    # Find end at next major table or appendix marker
    end = len(text)
    for marker in ["Table A3 Descriptive", "Appendix – Table A3"]:
        idx = text.find(marker, start + 1)
        if idx != -1 and idx < end:
            end = idx
    section = text[start:end]
    lines = section.split("\n")

    courses = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(skip in stripped for skip in [
            "Table A2", "Percentage", "Note", "(i)", "(ii)", "(iii)", "(iv)", "(v)", "Median",
            "Number  "
        ]):
            continue
        if stripped.startswith("Course  ") or stripped.startswith("-"):
            continue

        parts = stripped.split()
        if len(parts) < 8:
            continue

        # Find number (student count)
        num_idx = None
        for j, p in enumerate(parts):
            cleaned = p.replace(",", "")
            if cleaned.isdigit() and int(cleaned) >= 100:
                num_idx = j
                break
        if num_idx is None:
            continue

        course_name = " ".join(parts[:num_idx])
        number = int(parts[num_idx].replace(",", ""))
        remaining = parts[num_idx + 1:]

        if len(remaining) < 5:
            continue

        try:
            median_hsc = float(remaining[0])
            median_band = remaining[1]

            def safe_float(v):
                s = str(v).strip()
                if s == "<1":
                    return 0.5
                if not s or s == "-":
                    return 0.0
                return float(s)

            if len(remaining) >= 7:
                # Regular 2-unit course: bands 6,5,4,3,2
                bands = {
                    "6": safe_float(remaining[2]),
                    "5": safe_float(remaining[3]),
                    "4": safe_float(remaining[4]),
                    "3": safe_float(remaining[5]),
                    "2": safe_float(remaining[6]),
                }
            else:
                # Extension course: bands E4,E3,E2
                bands = {
                    "E4": safe_float(remaining[2]),
                    "E3": safe_float(remaining[3]),
                    "E2": safe_float(remaining[4]),
                }

            courses.append({
                "course": course_name,
                "number": number,
                "median_hsc_mark": median_hsc,
                "median_band": median_band,
                "band_percentages": bands,
            })
        except (ValueError, IndexError):
            continue

    # Deduplicate
    seen = set()
    unique = []
    for c in courses:
        if c["course"] not in seen:
            seen.add(c["course"])
            unique.append(c)

    return unique


def parse_table_a1(text):
    """Parse Table A1: Course enrolments, gender, ATAR eligibility, max ATAR."""
    start = None
    # Find actual Table A1 (not TOC entry)
    pos = 0
    while True:
        idx = text.find("Table A1 Course enrolments, gender", pos)
        if idx == -1:
            break
        after = text[idx:idx + 300]
        if "Note" in after and "Number" in after:
            start = idx
            break
        pos = idx + 10
    if start is None:
        return []

    end = text.rfind("Table A2", start + 1)
    if end == -1 or end < start:
        end = start + 5000
    section = text[start:end]
    lines = section.split("\n")

    courses = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(skip in stripped for skip in [
            "Table A1", "Course enrolments", "Number all",
            "Note", "(i)", "(ii)", "(iii)", "(iv)", "(v)", "(vi)", "(vii)", "(viii)",
            "Course  ", "% HSC", "% ATAR", "Maximum", "eligibility",
        ]):
            continue
        if stripped.startswith("all  "):
            continue

        parts = stripped.split()
        if len(parts) < 6:
            continue

        # Find number (student count - first large number)
        num_idx = None
        for j, p in enumerate(parts):
            cleaned = p.replace(",", "")
            if cleaned.isdigit() and int(cleaned) >= 100:
                if j + 3 < len(parts):  # need at least 3 more numbers
                    # Check next few are also numbers
                    all_nums = True
                    for k in range(j + 1, min(j + 4, len(parts))):
                        try:
                            float(parts[k].replace(",", ""))
                        except ValueError:
                            all_nums = False
                            break
                    if all_nums:
                        num_idx = j
                        break

        if num_idx is None:
            continue

        course_name = " ".join(parts[:num_idx])
        number_all = int(parts[num_idx].replace(",", ""))
        remaining = parts[num_idx + 1:]

        if len(remaining) >= 6:
            try:
                number_hsc = int(remaining[0].replace(",", ""))
                number_atar = int(remaining[1].replace(",", ""))
                pct_female = float(remaining[2])
                pct_hsc = float(remaining[3])
                pct_atar_eligible = float(remaining[4])
                max_atar = float(remaining[5])

                courses.append({
                    "course": course_name,
                    "number_all": number_all,
                    "number_hsc": number_hsc,
                    "number_atar": number_atar,
                    "percent_female": pct_female,
                    "percent_hsc": pct_hsc,
                    "percent_atar_eligible": pct_atar_eligible,
                    "maximum_atar": max_atar,
                })
            except (ValueError, IndexError):
                continue

    # Deduplicate by course name (continuation pages cause duplicates)
    seen = set()
    unique = []
    for c in courses:
        if c["course"] not in seen and c["course"] != "Total":
            seen.add(c["course"])
            unique.append(c)

    return unique


def main():
    all_data = {}

    for year in YEARS:
        print(f"\n{'=' * 60}")
        print(f"Processing {year}...")

        try:
            text = load_text(year)
        except FileNotFoundError:
            print(f"  Text file not found for {year}, extracting PDF...")
            if year == 2024:
                pdf_path = f"{BASE_DIR}/scaling-report-2024-nsw-hsc.pdf"
            else:
                pdf_path = f"{BASE_DIR}/scaling-data/scaling-report-{year}.pdf"
            if not os.path.exists(pdf_path):
                print(f"  PDF not found: {pdf_path}")
                continue
            result = subprocess.run(
                ["pdftotext", "-layout", pdf_path, "-"],
                capture_output=True, text=True,
            )
            text = result.stdout
            # Save for reuse
            if year == 2024:
                out_path = f"{BASE_DIR}/scaling-report-2024-nsw-hsc-layout.txt"
            else:
                out_path = f"{BASE_DIR}/scaling-data/scaling-report-{year}-layout.txt"
            with open(out_path, "w") as f:
                f.write(text)

        year_data = {}

        # Table A3
        a3 = parse_table_a3(text)
        a3_full = sum(1 for c in a3 if "scaled" in c)
        print(f"  Table A3: {len(a3)} courses ({a3_full} with scaled data)")
        year_data["table_a3"] = a3

        # Table A9
        a9 = parse_table_a9(text)
        print(f"  Table A9: {len(a9)} ATAR mappings")
        year_data["table_a9"] = a9

        # Table A7
        a7 = parse_table_a7(text)
        print(f"  Table A7: {len(a7)} ATAR entries")
        year_data["table_a7"] = a7

        # Table A2
        a2 = parse_table_a2(text)
        print(f"  Table A2: {len(a2)} courses")
        year_data["table_a2"] = a2

        # Table A1
        a1 = parse_table_a1(text)
        print(f"  Table A1: {len(a1)} courses")
        year_data["table_a1"] = a1

        # Table A8
        a8 = parse_table_a8(text)
        print(f"  Table A8: {len(a8)} percentiles")
        year_data["table_a8"] = a8

        all_data[str(year)] = year_data

    # Save output
    output_path = f"{BASE_DIR}/scaling-data/all-tables.json"
    with open(output_path, "w") as f:
        json.dump(all_data, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Saved to {output_path}")

    # Summary
    for year in sorted(all_data.keys()):
        d = all_data[year]
        print(f"\n{year}: A1={len(d.get('table_a1',[]))} A2={len(d.get('table_a2',[]))} "
              f"A3={len(d.get('table_a3',[]))} A7={len(d.get('table_a7',[]))} "
              f"A8={len(d.get('table_a8',[]))} A9={len(d.get('table_a9',[]))}")


if __name__ == "__main__":
    main()
