#!/usr/bin/env python3
"""Extract Table A3 for 2007-2009 from UAC Scaling Reports.
These years use a different layout: HSC line → course name line → scaled line."""

import subprocess
import json
import os
import re

BASE_DIR = "/Users/matthew/how does scaling work"
YEARS = [2007, 2008, 2009]


def load_text(year):
    path = f"{BASE_DIR}/scaling-data/scaling-report-{year}-layout.txt"
    with open(path) as f:
        return f.read()


def parse_table_a3_old(text):
    """Parse Table A3: old format where HSC data, course name, and scaled data are on separate lines."""
    # Find the actual table (first "Table A3 Descriptive" with "Notes:")
    start = None
    pos = 0
    while True:
        idx = text.find("Table A3 Descriptive", pos)
        if idx == -1:
            break
        if "Notes:" in text[idx:idx + 600]:
            start = idx
            break
        pos = idx + 10
    if start is None:
        return []

    # Find end
    end = len(text)
    for marker in ["Table A4"]:
        e = text.find(marker, start + 1)
        if e != -1 and e < end:
            end = e

    section = text[start:end]
    lines = section.split("\n")

    courses = []
    pending_hsc = None
    pending_course = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip headers and notes
        if any(s in stripped for s in [
            "Table A3", "Descriptive", "(i)", "(ii)", "(iii)",
            "Course  ", "Type of", "Number  ", "Appendix",
        ]):
            continue
        if re.match(r"^\d{1,3}$", stripped):
            continue

        parts = stripped.split()

        # Detect if this is an HSC line: starts with "HSC" followed by 8+ values
        if parts[0] == "HSC" and len(parts) >= 8:
            try:
                vals = [float(p) for p in parts[1:9]]
                pending_hsc = {
                    "mean": vals[0],
                    "sd": vals[1],
                    "max": vals[2],
                    "p99": vals[3],
                    "p90": vals[4],
                    "p75": vals[5],
                    "p50": vals[6],
                    "p25": vals[7],
                }
                pending_course = None
            except (ValueError, IndexError):
                pending_hsc = None
            continue

        # Detect if this is a scaled line: starts with "scaled" followed by 8+ values
        if parts[0].lower() == "scaled" and len(parts) >= 8:
            if pending_hsc is not None and pending_course is not None:
                try:
                    vals = [float(p) for p in parts[1:9]]
                    courses.append({
                        "course": pending_course["name"],
                        "number": pending_course["number"],
                        "hsc": pending_hsc,
                        "scaled": {
                            "mean": vals[0],
                            "sd": vals[1],
                            "max": vals[2],
                            "p99": vals[3],
                            "p90": vals[4],
                            "p75": vals[5],
                            "p50": vals[6],
                            "p25": vals[7],
                        },
                    })
                except (ValueError, IndexError):
                    pass
            pending_hsc = None
            pending_course = None
            continue

        # This should be a course name + number line
        # Format: "Course Name     NUMBER"
        if pending_hsc is not None:
            # Find number: look for digit sequences that form a student count
            num_idx = -1
            for j, p in enumerate(parts):
                cleaned = p.replace(",", "").replace(" ", "")
                if cleaned.isdigit():
                    # Walk back to collect all consecutive digit parts
                    start_idx = j
                    while start_idx > 0 and parts[start_idx - 1].replace(",", "").isdigit():
                        start_idx -= 1
                    # Walk forward
                    end_idx = j
                    while end_idx + 1 < len(parts) and parts[end_idx + 1].replace(",", "").isdigit():
                        end_idx += 1
                    # Concatenate and check if >= 100
                    combined = "".join(parts[k].replace(",", "") for k in range(start_idx, end_idx + 1))
                    if int(combined) >= 100:
                        num_idx = start_idx
                        break

            if num_idx >= 0 and num_idx < len(parts) and num_idx > 0:
                course_name = " ".join(parts[:num_idx])
                # Reconstruct number (handle space-split thousands like "11 348")
                num_parts = []
                k = num_idx
                while k < len(parts) and parts[k].replace(",", "").isdigit():
                    num_parts.append(parts[k].replace(",", ""))
                    k += 1
                number = int("".join(num_parts)) if num_parts else 0
                if not course_name:
                    continue
                pending_course = {"name": course_name, "number": number}
            continue

    return courses


def main():
    # Load existing data
    existing_path = f"{BASE_DIR}/scaling-data/all-tables.json"
    with open(existing_path) as f:
        all_data = json.load(f)

    for year in YEARS:
        print(f"\n{'=' * 60}")
        print(f"Processing {year} (old format)...")

        try:
            text = load_text(year)
        except FileNotFoundError:
            print(f"  Text file not found, extracting PDF...")
            pdf_path = f"{BASE_DIR}/scaling-data/scaling-report-{year}.pdf"
            if not os.path.exists(pdf_path):
                print(f"  PDF not found: {pdf_path}")
                continue
            result = subprocess.run(
                ["pdftotext", "-layout", pdf_path, "-"],
                capture_output=True, text=True,
            )
            text = result.stdout
            out_path = f"{BASE_DIR}/scaling-data/scaling-report-{year}-layout.txt"
            with open(out_path, "w") as f:
                f.write(text)

        a3 = parse_table_a3_old(text)
        a3_full = sum(1 for c in a3 if "scaled" in c)
        print(f"  Table A3: {len(a3)} courses ({a3_full} with scaled data)")

        # Show first 3
        for c in a3[:3]:
            print(f"    - {c['course']}: HSC mean={c['hsc']['mean']}, scaled mean={c['scaled']['mean']}")

        # Add to existing data
        year_str = str(year)
        if year_str not in all_data:
            all_data[year_str] = {}
        all_data[year_str]["table_a3_old"] = a3

    # Save updated file
    with open(existing_path, "w") as f:
        json.dump(all_data, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Saved to {existing_path}")


if __name__ == "__main__":
    main()
