#!/usr/bin/env python3
"""
Regenerate the project's static data files from the v2 extraction output.

Reads scaling-v2-output.json → produces:
  1. src/data/table_a3_all_years.json  — all courses (flat mean/sd/max)
  2. src/data/scaling-percentiles.json — courses WITH percentile data only
  3. src/data/course_year_index.json   — course → year availability map
"""

import json
import os

BASE_DIR = "/Users/matthew/how does scaling work/hsc-truth-engine"
V2_PATH = f"{BASE_DIR}/research/scaling-data/scaling-v2-output.json"
OUT_ALL = f"{BASE_DIR}/src/data/table_a3_all_years.json"
OUT_PERCENTILES = f"{BASE_DIR}/src/data/scaling-percentiles.json"
OUT_INDEX = f"{BASE_DIR}/src/data/course_year_index.json"

# Backup existing files
for path in [OUT_ALL, OUT_PERCENTILES, OUT_INDEX]:
    if os.path.exists(path):
        bak = path + ".bak"
        with open(path) as f_in, open(bak, "w") as f_out:
            f_out.write(f_in.read())
        print(f"Backed up: {bak}")

with open(V2_PATH) as f:
    v2_data = json.load(f)

# --- table_a3_all_years.json ---
# Flat format: {year: {courses: [{course, number, hsc_mean, hsc_sd, hsc_max, scaled_mean, scaled_sd, scaled_max}]}}
all_years_output = {}
for year_str, year_data in sorted(v2_data.items()):
    courses = year_data.get("table_a3", [])
    flat_courses = []
    for c in courses:
        flat_courses.append({
            "course": c["course"],
            "number": c["number"],
            "hsc_mean": c["hsc"]["mean"],
            "hsc_sd": c["hsc"]["sd"],
            "hsc_max": c["hsc"]["max"],
            "scaled_mean": c["scaled"]["mean"],
            "scaled_sd": c["scaled"]["sd"],
            "scaled_max": c["scaled"]["max"],
        })
    all_years_output[year_str] = {"courses": flat_courses}

# --- scaling-percentiles.json ---
# Full percentile format, but ONLY courses that have percentile data (p99 is not null)
# Structure: {year: {table_a3: [{course, number, hsc: {mean, sd, max, p99, p90, p75, p50, p25}, scaled: {...}}]}}
percentiles_output = {}
for year_str, year_data in sorted(v2_data.items()):
    courses = year_data.get("table_a3", [])
    pct_courses = []
    for c in courses:
        # Only include courses with percentile data
        if c["hsc"].get("p99") is not None and c["scaled"].get("p99") is not None:
            pct_courses.append({
                "course": c["course"],
                "number": c["number"],
                "hsc": {
                    "mean": c["hsc"]["mean"],
                    "sd": c["hsc"]["sd"],
                    "max": c["hsc"]["max"],
                    "p99": c["hsc"]["p99"],
                    "p90": c["hsc"]["p90"],
                    "p75": c["hsc"]["p75"],
                    "p50": c["hsc"]["p50"],
                    "p25": c["hsc"]["p25"],
                },
                "scaled": {
                    "mean": c["scaled"]["mean"],
                    "sd": c["scaled"]["sd"],
                    "max": c["scaled"]["max"],
                    "p99": c["scaled"]["p99"],
                    "p90": c["scaled"]["p90"],
                    "p75": c["scaled"]["p75"],
                    "p50": c["scaled"]["p50"],
                    "p25": c["scaled"]["p25"],
                },
            })
    if pct_courses:
        percentiles_output[year_str] = {"table_a3": pct_courses}

# --- course_year_index.json ---
# {course_name: {year: true}}
course_index = {}
for year_str, year_data in sorted(v2_data.items()):
    for c in year_data.get("table_a3", []):
        if c["course"] not in course_index:
            course_index[c["course"]] = {}
        course_index[c["course"]][year_str] = True

# Write all outputs
for path, data in [
    (OUT_ALL, all_years_output),
    (OUT_PERCENTILES, percentiles_output),
    (OUT_INDEX, course_index),
]:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote: {path}")

# Summary
total_courses = len(course_index)
total_pct_entries = sum(len(v.get("table_a3", [])) for v in percentiles_output.values())
total_all_entries = sum(len(v.get("courses", [])) for v in all_years_output.values())
total_small = total_all_entries - total_pct_entries

print(f"\nSummary:")
print(f"  Unique courses: {total_courses}")
print(f"  Total course-year entries: {total_all_entries}")
print(f"  Courses with percentiles: {total_pct_entries}")
print(f"  Small courses (z-score only): {total_small}")
print(f"  Years covered: {sorted(all_years_output.keys())}")
