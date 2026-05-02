#!/usr/bin/env python3
"""SPaRO HSC Annual Report Scraper.
Downloads NSW public school annual reports from reports.sparo.schools.nsw.gov.au,
extracts HSC subject average tables, and saves structured JSON output.
"""

import subprocess
import json
import re
import os
import tempfile
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin

BASE_URL = "https://reports.sparo.schools.nsw.gov.au/annual-report/"
MASTER_DATASET_URL = "https://data.nsw.gov.au/data/dataset/78c10ea3-8d04-4c9c-b255-bbf8547e37e7/resource/3e6d5f6a-055c-440d-a690-fc0537c31095/download/master_dataset.csv"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "hsc-truth-engine", "data", "sparo")
YEARS = list(range(2016, 2026))
MAX_WORKERS = 8
REQUEST_TIMEOUT = 60

os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_schools():
    """Load eligible NSW public high schools from master dataset."""
    import csv
    import io
    import urllib.request

    schools = []
    with urllib.request.urlopen(MASTER_DATASET_URL) as resp:
        content = resp.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        level = row.get("Level_of_schooling", "")
        subtype = row.get("School_subtype", "")
        code = row.get("School_code", "")
        name = row.get("School_name", "")
        if not code or not name:
            continue
        eligible = False
        if level == "Secondary School" and subtype in (
            "Year 7 to Year 12", "Year 11 to Year 12", "Year 10 to Year 12"
        ):
            eligible = True
        elif level == "Central/Community School" and subtype in (
            "Kindergarten to Year 12", "Preschool to Year 12"
        ):
            eligible = True
        if eligible:
            schools.append({"code": code, "name": name, "suburb": row.get("Town_suburb", "")})
    return schools


def build_url(year, code, name):
    """Construct the SPaRO annual report URL."""
    name_safe = name.replace(" ", "_")
    return f"{BASE_URL}{year}/{code}/{year}_{name_safe}_Annual_Report.pdf"


def download_pdf(url):
    """Download PDF from URL, return bytes. Returns None on failure."""
    import urllib.request
    import urllib.error

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            if resp.status == 200:
                return resp.read()
            return None
    except Exception:
        return None


def extract_text(pdf_bytes):
    """Extract text from PDF bytes using pdftotext -layout."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", tmp_path, "-"],
            capture_output=True, text=True, timeout=30,
        )
        return result.stdout
    finally:
        os.unlink(tmp_path)


def parse_hsc_table(text, year):
    """Parse HSC performance table from annual report text.

    Table format:
        <header with 'School Average'>
        Subject            School {year}      SSSG    State    {year_range}
        Subject Name        76.5              78.1    71.2     75.0
        ...
    """
    if not text:
        return []

    # Locate the HSC table section
    idx = text.find("School Average")
    if idx == -1:
        idx = text.find("school average")
    if idx == -1:
        return []

    # Find the table start (first data row)
    lines = text[idx:].split("\n")
    data_start = 0
    for i, line in enumerate(lines):
        # Look for first data row: starts with a word, has 3-4 numbers
        stripped = line.strip()
        if not stripped:
            continue
        if any(skip in stripped.lower() for skip in ["school average", "subject", "page ", "printed on"]):
            continue
        # Check for subject line pattern: text + 2+ numbers
        nums = re.findall(r'\b\d+\.\d+\b', stripped)
        if len(nums) >= 2 and not re.match(r'^\d', stripped):
            # Verify it looks like a subject row (not just random text with numbers)
            # Subject name should start with a letter
            if re.match(r'^[A-Za-z]', stripped) and len(stripped) > 10:
                data_start = i
                break

    if data_start == 0:
        return []

    # Parse data rows
    subjects = []
    pending_subject = None

    for line in lines[data_start:]:
        stripped = line.strip()
        if not stripped:
            if pending_subject:
                subjects.append(pending_subject)
                pending_subject = None
            continue

        # Stop conditions
        if any(marker in stripped.lower() for marker in [
            "Page ", "student enrolment", "workforce information",
            "financial summary", "parent/caregiver", "policy requirements",
        ]):
            if pending_subject:
                subjects.append(pending_subject)
            break

        # Extract numbers from line
        nums = re.findall(r'\b(\d+\.\d+)\b', stripped)
        nums_float = [float(n) for n in nums]

        if len(nums_float) >= 2 and re.match(r'^[A-Za-z]', stripped):
            # This is a data row with subject name + numbers
            # Find where numbers start
            first_num_idx = stripped.find(nums[0])

            # Check if subject starts where the previous column ends or is merged
            # Extract subject part (before first number)
            subject_part = stripped[:first_num_idx].strip()

            # If this is a continuation of previous subject (starts lowercase or is part of previous)
            if pending_subject and subject_part and subject_part[0].islower():
                pending_subject["subject"] += " " + subject_part
                continue

            # If pending subject exists, save it
            if pending_subject:
                subjects.append(pending_subject)

            # Create new subject entry
            pending_subject = {
                "subject": subject_part,
                "school_average": nums_float[0],
            }

            # Map remaining numbers
            if len(nums_float) >= 2:
                pending_subject["sssg"] = nums_float[1]
            if len(nums_float) >= 3:
                pending_subject["state_average"] = nums_float[2]
            if len(nums_float) >= 4:
                pending_subject["school_average_multiyear"] = nums_float[3]

        elif pending_subject and len(nums_float) == 0:
            # Continuation line (no numbers) - append to subject name
            if not stripped[0].isdigit():
                pending_subject["subject"] += " " + stripped

    if pending_subject:
        subjects.append(pending_subject)

    return subjects


def process_school(year, school):
    """Download and parse one school's report for one year."""
    code = school["code"]
    name = school["name"]
    url = build_url(year, code, name)

    pdf_bytes = download_pdf(url)
    if pdf_bytes is None:
        return {"code": code, "name": name, "year": year, "status": "download_failed", "subjects": []}

    text = extract_text(pdf_bytes)
    if not text:
        return {"code": code, "name": name, "year": year, "status": "extraction_failed", "subjects": []}

    subjects = parse_hsc_table(text, year)
    if not subjects:
        return {"code": code, "name": name, "year": year, "status": "no_hsc_table", "subjects": []}

    return {"code": code, "name": name, "year": year, "status": "ok", "subjects": subjects}


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Scrape SPaRO HSC annual reports")
    parser.add_argument("--years", nargs="+", type=int, help="Specific years (default: all 2016-2025)")
    parser.add_argument("--schools", nargs="+", type=str, help="Specific school codes (default: all)")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help=f"Concurrent workers (default: {MAX_WORKERS})")
    parser.add_argument("--limit", type=int, help="Limit number of schools")
    parser.add_argument("--dry-run", action="store_true", help="Only check URL availability, don't download")
    args = parser.parse_args()

    years = args.years if args.years else YEARS
    workers = args.workers

    print(f"Loading school list...")
    all_schools = load_schools()

    if args.schools:
        all_schools = [s for s in all_schools if s["code"] in args.schools]
    if args.limit:
        all_schools = all_schools[:args.limit]

    print(f"Schools: {len(all_schools)} | Years: {years} | Workers: {workers}")
    total_tasks = len(all_schools) * len(years)
    print(f"Total tasks: {total_tasks}")

    if args.dry_run:
        print("\nDry run - checking URLs only...")
        success = 0
        fail = 0
        for school in all_schools[:min(20, len(all_schools))]:
            for year in years[:2]:
                url = build_url(year, school["code"], school["name"])
                pdf_bytes = download_pdf(url)
                if pdf_bytes:
                    success += 1
                else:
                    fail += 1
                    print(f"  FAIL: [{year}] {school['code']} {school['name']}")
        print(f"\nSuccess: {success}/{success+fail}")
        return

    all_results = {}

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {}
        for year in years:
            for school in all_schools:
                future = executor.submit(process_school, year, school)
                futures[future] = (year, school)

        done = 0
        ok_count = 0
        fail_count = 0

        for future in as_completed(futures):
            done += 1
            try:
                result = future.result()
            except Exception as e:
                year, school = futures[future]
                print(f"[{done}/{total_tasks}] ERROR {year} {school['code']}: {e}")
                fail_count += 1
                continue

            code = result["code"]
            year = result["year"]
            status = result["status"]

            if status == "ok":
                ok_count += 1
                key = code
                if key not in all_results:
                    all_results[key] = {"code": code, "name": result["name"], "years": {}}
                all_results[key]["years"][str(year)] = result["subjects"]
            else:
                fail_count += 1

            if done % 50 == 0 or done == total_tasks:
                print(f"[{done}/{total_tasks}] OK: {ok_count} | Fail: {fail_count}")

    # Save per-year files
    for year in years:
        year_data = {}
        for code, data in all_results.items():
            if str(year) in data["years"]:
                year_data[code] = {
                    "name": data["name"],
                    "subjects": data["years"][str(year)],
                }
        if year_data:
            output_path = os.path.join(OUTPUT_DIR, f"sparo_hsc_{year}.json")
            with open(output_path, "w") as f:
                json.dump(year_data, f, indent=2)
            print(f"Saved {year}: {len(year_data)} schools -> {output_path}")

    # Save combined file
    combined_path = os.path.join(OUTPUT_DIR, "sparo_hsc_all.json")
    with open(combined_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"Saved combined: {combined_path}")
    print(f"\nDone. OK: {ok_count}, Failed: {fail_count}")


if __name__ == "__main__":
    main()
