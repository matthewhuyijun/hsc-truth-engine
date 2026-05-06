#!/usr/bin/env python3
"""
Data Integrity Verifier — checks all school-detail JSON files against source CSVs.
Ensures no discrepancies like the 2021/2023 all-rounder dropout ever happen again.
"""

import csv
import json
import os
import sys
from collections import defaultdict

CSV_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'csv')
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
ARCHIVE_DIR = os.path.join(CSV_DIR, 'archive-distinguished')
YEARS = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
ARCHIVE_YEARS = ['2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
                 '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016']

def header_key(variants):
    """Return a function that extracts value from row trying multiple header names."""
    def extract(row):
        for v in variants:
            if v in row:
                return row[v]
        return ''
    return extract

# ========== CSV Parsers ==========

def parse_distinguished(year):
    """Return {(first, last, school): [(code, name), ...]}"""
    path = os.path.join(CSV_DIR, 'distinguished-achievers', f'{year}.csv')
    results = {}
    with open(path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            fn = row.get('first_name', row.get('First name', '')).strip()
            ln = row.get('last_name', row.get('Last name', '')).strip()
            sn = row.get('main_school_name', row.get('Main school name', '')).strip()
            if not fn or not sn:
                continue
            courses_str = row.get('top_band_courses', '')
            key = (fn, ln, sn)
            courses = []
            if courses_str:
                parts = courses_str.strip().split()
                i = 0
                while i < len(parts):
                    code = parts[i]
                    i += 1
                    name_parts = []
                    while i < len(parts) and (not parts[i].isdigit() or len(parts[i]) < 4):
                        name_parts.append(parts[i])
                        i += 1
                    name = ' '.join(name_parts)
                    if code.isdigit():
                        courses.append((code, name))
            results[key] = courses
    return results

def parse_all_rounders(year):
    """Return set of (first, last, school) normalized."""
    path = os.path.join(CSV_DIR, 'all-round-achievers', f'{year}.csv')
    results = set()
    with open(path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            fn = row.get('first_name', row.get('First name', row.get('\ufeffFirst name', ''))).strip()
            ln = row.get('last_name', row.get('Last name', '')).strip()
            sn = row.get('main_school_name', row.get('Main school name', '')).strip()
            if fn and sn:
                results.add((fn, ln, sn))
    return results

def parse_top_achievers(year):
    """Return {(first, last, school): {course_code: rank}}"""
    path = os.path.join(CSV_DIR, 'top-achievers', f'{year}.csv')
    results = defaultdict(dict)
    with open(path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            fn = row.get('first_name', row.get('First name', '')).strip()
            ln = row.get('last_name', row.get('Last name', '')).strip()
            sn = row.get('school_name', row.get('School name', '')).strip()
            cn = row.get('course_number', row.get('Course no', '')).strip()
            place = row.get('place', row.get('Place', '0'))
            try:
                place = int(place)
            except ValueError:
                place = 0
            if fn and sn and cn and place > 0:
                results[(fn, ln, sn)][cn] = place
    return results


# ========== Archive JSON Parser (pre-2017) ==========

def parse_archive_year(year):
    """
    Parse archive-distinguished/{year}.json and return:
      archive_students: {school_name: [(first, last, frozenset(codes)), ...]}
      archive_total: total individual course entries across all schools
    Archive format: [["Student Name", "School Name", "course1, course2, ..."], ...]
    Skip rows that look like page-header ranges (col1 contains ' to ' or no comma in name).
    """
    path = os.path.join(ARCHIVE_DIR, f'{year}.json')
    if not os.path.exists(path):
        return None, 0

    with open(path, encoding='utf-8') as f:
        rows = json.load(f)

    school_map = defaultdict(list)  # school_name -> [(first, last, frozenset(codes))]
    total_courses = 0

    for row in rows:
        if not row or len(row) < 3:
            continue
        name_str = str(row[0]) if row[0] else ''
        school_str = str(row[1]) if row[1] else ''
        courses_str = str(row[2]) if row[2] else ''

        if not name_str or not school_str:
            continue
        # Skip page-header / range rows
        if ' to ' in school_str or ' to ' in name_str:
            continue
        if ',' not in name_str:
            continue

        parts = name_str.split(',', 1)
        if len(parts) < 2:
            continue
        last = parts[0].strip()
        first = parts[1].strip()

        # Extract 5-digit course codes
        codes = []
        for part in courses_str.split(','):
            part = part.strip()
            if part.isdigit() and len(part) == 5:
                codes.append(part)

        if not codes:
            continue

        school_map[school_str.strip()].append((first, last, frozenset(codes)))
        total_courses += len(codes)

    return dict(school_map), total_courses


# ========== Pre-2017 Archive Verification ==========

def verify_archive_year(year):
    print(f"\n{'─'*60}")
    print(f" Archive {year}")
    print(f"{'─'*60}")

    errors = 0
    warnings = 0

    json_path = os.path.join(PUBLIC_DIR, f'school-detail-{year}.json')
    if not os.path.exists(json_path):
        print(f"  ✗ MISSING: {json_path}")
        return 1, 0

    with open(json_path) as f:
        json_data = json.load(f)

    archive_schools, archive_total = parse_archive_year(year)
    if archive_schools is None:
        print(f"  ✗ MISSING: archive-distinguished/{year}.json")
        return 1, 0

    # Build JSON lookup: school_name -> { (first,last): set(codes) }
    json_student_codes = defaultdict(lambda: defaultdict(set))
    # Also track unique student count and total course entries per school
    json_unique = defaultdict(set)
    json_total = defaultdict(int)

    for slug, school in json_data.items():
        sname = school['name']
        for st in school.get('students', []):
            key = (st['firstName'], st['lastName'])
            json_unique[sname].add(key)
            for c in st.get('courses', []):
                json_student_codes[sname][key].add(c['code'])
                json_total[sname] += 1

    # Per-school verification
    school_errors = 0
    for sname, archive_students in archive_schools.items():
        # 1. Student count match
        json_student_keys = json_unique.get(sname, set())
        archive_student_keys = set((f, l) for f, l, _ in archive_students)

        missing = archive_student_keys - json_student_keys
        if missing:
            if school_errors < 3:
                for f, l in list(missing)[:3]:
                    print(f"  ✗ [{sname}] student in archive but NOT in JSON: {f} {l}")
            school_errors += 1

        extra = json_student_keys - archive_student_keys
        if extra:
            if school_errors < 3:
                for f, l in list(extra)[:3]:
                    print(f"  ⚠ [{sname}] student in JSON but NOT in archive: {f} {l}")
            school_errors += 1

        # 2. Per-student course code verification
        for first, last, archive_codes in archive_students:
            key = (first, last)
            json_codes = json_student_codes.get(sname, {}).get(key, set())
            missing_codes = archive_codes - json_codes
            if missing_codes:
                if school_errors < 5:
                    print(f"  ✗ [{sname}] {first} {last}: archive has codes {sorted(archive_codes)} but JSON has {sorted(json_codes)}")
                school_errors += 1
            extra_codes = json_codes - archive_codes
            if extra_codes:
                if school_errors < 5:
                    print(f"  ⚠ [{sname}] {first} {last}: JSON has extra codes {sorted(extra_codes)} not in archive")
                school_errors += 1

        # 3. Total course count match
        json_school_total = json_total.get(sname, 0)
        archive_school_total = sum(len(codes) for _, _, codes in archive_students)
        if json_school_total != archive_school_total:
            if school_errors < 3:
                print(f"  ✗ [{sname}] total course entries: JSON={json_school_total} archive={archive_school_total}")
            school_errors += 1

    # Cross-school: any school in JSON but not in archive?
    archive_school_names = set(archive_schools.keys())
    json_school_names = set(json_unique.keys())
    extra_schools = json_school_names - archive_school_names
    if extra_schools:
        print(f"  ⚠ {len(extra_schools)} school(s) in JSON but not in archive (new schools?)")
        warnings += 1

    # Summary
    total_unique_archive = sum(len(v) for v in archive_schools.values())
    total_unique_json = sum(len(v) for v in json_unique.values())

    print(f"  Archive: {total_unique_archive} students, {archive_total} course entries across {len(archive_schools)} schools")
    print(f"  JSON:    {total_unique_json} students, {sum(json_total.values())} course entries across {len(json_school_names)} schools")

    if school_errors > 0:
        errors += school_errors
    if errors == 0:
        print(f"  ✓ {len(archive_schools)} schools verified — no errors")
    else:
        print(f"  ⚠ {school_errors} discrepancies across {errors} checks")

    return errors, warnings


# ========== Verification ==========

def verify_all():
    total_errors = 0
    total_warnings = 0

    for year in YEARS:
        errors, warnings = verify_year(year)
        total_errors += errors
        total_warnings += warnings

    # Pre-2017 archive verification
    print(f"\n{'='*60}")
    print(" PRE-2017 ARCHIVE INTEGRITY")
    print(f"{'='*60}")
    for year in ARCHIVE_YEARS:
        errors, warnings = verify_archive_year(year)
        total_errors += errors
        total_warnings += warnings

    print(f"\n{'='*60}")
    if total_errors == 0 and total_warnings == 0:
        print(" ALL CHECKS PASSED — DATA INTEGRITY CONFIRMED")
    else:
        print(f" {total_errors} ERROR(S), {total_warnings} WARNING(S) — NEEDS FIXING")
    print(f"{'='*60}")

    return total_errors == 0

def verify_year(year):
    print(f"\n{'─'*60}")
    print(f" Year {year}")
    print(f"{'─'*60}")

    errors = 0
    warnings = 0

    json_path = os.path.join(PUBLIC_DIR, f'school-detail-{year}.json')
    if not os.path.exists(json_path):
        print(f"  ✗ MISSING: {json_path}")
        return 1, 0

    with open(json_path) as f:
        json_data = json.load(f)

    dist = parse_distinguished(year)
    all_rounders = parse_all_rounders(year)
    top_achievers = parse_top_achievers(year)

    # Check: every student in CSV is in JSON
    csv_keys = set(dist.keys())
    json_students_by_school = defaultdict(set)
    for slug, school in json_data.items():
        for st in school.get('students', []):
            key = (st['firstName'], st['lastName'], school['name'])
            json_students_by_school[school['name']].add(key)

    all_json_keys = set()
    for students in json_students_by_school.values():
        all_json_keys.update(students)

    missing_from_json = csv_keys - all_json_keys
    if missing_from_json:
        print(f"  ✗ {len(missing_from_json)} students in CSV but NOT in JSON")
        for k in list(missing_from_json)[:3]:
            print(f"      - {k[0]} {k[1]} @ {k[2]}")
        errors += 1

    # Check: every student in JSON has corresponding CSV entry
    extra_in_json = all_json_keys - csv_keys
    if extra_in_json:
        print(f"  ⚠ {len(extra_in_json)} students in JSON but NOT in CSV (extra data?)")
        for k in list(extra_in_json)[:3]:
            print(f"      - {k[0]} {k[1]} @ {k[2]}")
        warnings += 1

    # Check per school
    school_errors = 0
    for slug, school in json_data.items():
        sname = school['name']
        stats = school['stats']
        students = school.get('students', [])
        courses = school.get('courses', [])

        # 1. stats.allRounders matches isAllRounder count
        actual_ar = sum(1 for st in students if st.get('isAllRounder'))
        if stats.get('allRounders', 0) != actual_ar:
            if school_errors < 3:
                print(f"  ✗ [{sname}] stats.allRounders={stats.get('allRounders',0)} but actual={actual_ar}")
            school_errors += 1

        # 2. All-rounder CSV check: every AR in CSV is flagged, and vice versa
        csv_ar_keys = all_rounders & json_students_by_school[sname]
        json_ar_keys = {
            (st['firstName'], st['lastName'], sname)
            for st in students if st.get('isAllRounder')
        }
        missing_ar = csv_ar_keys - json_ar_keys
        if missing_ar:
            if school_errors < 3:
                names = ', '.join(f'{k[0]} {k[1]}' for k in list(missing_ar)[:3])
                print(f"  ✗ [{sname}] {len(missing_ar)} student(s) in all-rounder CSV but not flagged: {names}...")
            school_errors += 1

        extra_ar = json_ar_keys - csv_ar_keys
        if extra_ar:
            if school_errors < 3:
                names = ', '.join(f'{k[0]} {k[1]}' for k in list(extra_ar)[:3])
                print(f"  ⚠ [{sname}] {len(extra_ar)} student(s) flagged as AR but not in all-rounder CSV: {names}...")
            warnings += 1

        # 3. State rank count check
        for st in students:
            key = (st['firstName'], st['lastName'], sname)
            csv_ranks = top_achievers.get(key, {})
            actual_sr = len(csv_ranks)

            if st.get('stateRankCount', 0) != actual_sr:
                if school_errors < 5:
                    print(f"  ✗ [{sname}] {st['firstName']} {st['lastName']}: stateRankCount={st.get('stateRankCount',0)} but CSV has {actual_sr}")
                school_errors += 1

            # 4. Individual course rank check
            for c in st.get('courses', []):
                csv_rank = csv_ranks.get(c['code'], 0)
                json_rank = c.get('rank', 0)
                if json_rank != csv_rank:
                    if school_errors < 5:
                        print(f"  ✗ [{sname}] {st['firstName']} {st['lastName']} course {c['code']}: rank={json_rank} but CSV has {csv_rank}")
                    school_errors += 1

        # 5. stats.band6Count = sum of all student b6Counts
        total_b6_students = sum(st.get('b6Count', 0) for st in students)
        if stats.get('band6Count', 0) != total_b6_students:
            if school_errors < 3:
                print(f"  ✗ [{sname}] stats.band6Count={stats.get('band6Count',0)} but student sum={total_b6_students}")
            school_errors += 1

        # 6. stats.uniqueStudents matches student count
        if stats.get('uniqueStudents', 0) != len(students):
            if school_errors < 3:
                print(f"  ✗ [{sname}] stats.uniqueStudents={stats.get('uniqueStudents',0)} but actual={len(students)}")
            school_errors += 1

        # 7. Course list band6Counts match student course counts
        expected_course_counts = defaultdict(int)
        expected_course_ranks = defaultdict(set)
        for st in students:
            for c in st.get('courses', []):
                expected_course_counts[c['code']] += 1
                if c.get('rank', 0) > 0:
                    expected_course_ranks[c['code']].add(c['rank'])

        for c in courses:
            if c.get('band6Count', 0) != expected_course_counts.get(c['code'], 0):
                if school_errors < 3:
                    print(f"  ✗ [{sname}] course {c['code']}: band6Count={c.get('band6Count')} but expected={expected_course_counts.get(c['code'], 0)}")
                school_errors += 1

            expected_ranks = sorted(expected_course_ranks.get(c['code'], set()))
            actual_ranks = sorted(c.get('stateRanks', []))
            if actual_ranks != expected_ranks:
                if school_errors < 3:
                    print(f"  ✗ [{sname}] course {c['code']}: stateRanks={actual_ranks} but expected={expected_ranks}")
                school_errors += 1

        if school_errors > 0:
            errors += 1

    if errors == 0:
        print(f"  ✓ {len(json_data)} schools verified — no errors")
    else:
        print(f"  ⚠ {len(json_data)} schools checked — {school_errors} total discrepancies across {errors} schools")

    # Summary stats
    ar_in_csv = len(all_rounders)
    ar_in_json = sum(1 for _, school in json_data.items() for st in school.get('students', []) if st.get('isAllRounder'))
    sr_in_csv = len(top_achievers)
    sr_in_json = sum(1 for _, school in json_data.items() for st in school.get('students', []) if st.get('stateRankCount', 0) > 0)

    print(f"  CSV all-rounders: {ar_in_csv}  |  JSON all-rounders: {ar_in_json}")
    print(f"  CSV top-achievers: {sr_in_csv}  |  JSON state-rank students: {sr_in_json}")

    if ar_in_csv != ar_in_json:
        print(f"  ✗ ALL-ROUNDER MISMATCH: CSV={ar_in_csv} JSON={ar_in_json}")
        errors += 1
    else:
        print(f"  ✓ All-rounder counts match")

    return errors, warnings


if __name__ == '__main__':
    ok = verify_all()
    sys.exit(0 if ok else 1)
