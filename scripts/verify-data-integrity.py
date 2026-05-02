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
YEARS = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']

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

# ========== Verification ==========

def verify_all():
    total_errors = 0
    total_warnings = 0

    for year in YEARS:
        errors, warnings = verify_year(year)
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
