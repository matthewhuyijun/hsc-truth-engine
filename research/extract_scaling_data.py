#!/usr/bin/env python3
"""Extract Table A3 and Table A9 from UAC Scaling Reports for all years."""

import subprocess
import json
import os
import re

def extract_text_from_pdf(pdf_path):
    result = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], capture_output=True, text=True)
    return result.stdout

def parse_table_a3(text, year):
    """
    Parse Table A3 from the extracted text.
    Format:
    Course Name              Number  hsc/sca   Mean   SD   Max   P99  P90  P75  P50  P25
    (empty)                     sca  Mean   SD   Max   P99  P90  P75  P50  P25
    """
    lines = text.split('\n')
    courses = []

    # Track the current course being built
    current_course = None

    for i, line in enumerate(lines):
        # Strip leading/trailing whitespace but preserve structure
        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            continue

        # Skip header lines
        if 'Table A3' in line and 'Descriptive' in line:
            continue
        if 'Type of' in line and 'mark' in line:
            continue
        if 'Course' in line and 'Number' in line:
            continue
        if stripped.startswith('Notes:'):
            continue
        if stripped.startswith('(i)') or stripped.startswith('(ii)') or stripped.startswith('(iii)') or stripped.startswith('(iv)'):
            continue
        if re.match(r'^\d+$', stripped):  # Page numbers like "41"
            continue
        if 'Appendix' in stripped:
            continue

        # Check if this is a "sca" or "scaled" line (scaled data continuation)
        first_word = stripped.split()[0].lower() if stripped.split() else ''
        if first_word in ['sca', 'scaled']:
            parts = stripped.split()
            if len(parts) >= 7 and current_course:
                try:
                    current_course['scaled'] = {
                        'mean': float(parts[1]),
                        'sd': float(parts[2]),
                        'max': float(parts[3]),
                        'p99': float(parts[4]),
                        'p90': float(parts[5]),
                        'p75': float(parts[6]),
                        'p50': float(parts[7]),
                        'p25': float(parts[8]) if len(parts) > 8 else 0
                    }
                    courses.append(current_course)
                    current_course = None
                except (ValueError, IndexError):
                    pass
            continue

        # This should be an HSC data line
        # Format: COURSE_NAME NUMBER hsc MEAN SD MAX P99 P90 P75 P50 P25
        parts = stripped.split()

        # Find where the number is (student count)
        num_idx = -1
        for j, part in enumerate(parts):
            cleaned = part.replace(',', '')
            if cleaned.isdigit() and 100 <= int(cleaned) <= 100000:
                num_idx = j
                break

        if num_idx == -1:
            continue

        # Check if next part is 'hsc'
        if num_idx + 1 >= len(parts):
            continue

        mark_type = parts[num_idx + 1].lower()
        if mark_type != 'hsc':
            continue

        # Extract course name (everything before the number)
        course_name = ' '.join(parts[:num_idx])
        num = int(parts[num_idx].replace(',', ''))

        # Now try to parse the statistics
        try:
            hsc_mean = float(parts[num_idx + 2])
            hsc_sd = float(parts[num_idx + 3])
            hsc_max = float(parts[num_idx + 4])
            hsc_p99 = float(parts[num_idx + 5])
            hsc_p90 = float(parts[num_idx + 6])
            hsc_p75 = float(parts[num_idx + 7])
            hsc_p50 = float(parts[num_idx + 8])
            hsc_p25 = float(parts[num_idx + 9]) if num_idx + 9 < len(parts) else 0

            current_course = {
                'course': course_name,
                'number': num,
                'hsc': {
                    'mean': hsc_mean,
                    'sd': hsc_sd,
                    'max': hsc_max,
                    'p99': hsc_p99,
                    'p90': hsc_p90,
                    'p75': hsc_p75,
                    'p50': hsc_p50,
                    'p25': hsc_p25
                }
            }
        except (ValueError, IndexError):
            current_course = None
            continue

    # Don't forget the last course if it has no scaled data
    if current_course:
        courses.append(current_course)

    return courses

def parse_table_a9(text):
    """Parse Table A9 ATAR to Aggregate mapping."""
    lines = text.split('\n')
    mappings = []

    for line in lines:
        line = line.strip()
        parts = line.split()

        if len(parts) >= 2:
            try:
                atar = float(parts[0])
                if 30.00 <= atar <= 99.95:
                    aggregates = []
                    for x in parts[1:]:
                        try:
                            aggregates.append(float(x))
                        except ValueError:
                            break
                    if aggregates:
                        mappings.append({'atar': atar, 'aggregates': aggregates})
            except ValueError:
                continue

    return mappings

def extract_table_a3_section(text):
    """
    Extract the Table A3 section from text.
    Returns the relevant portion of text containing Table A3 data.
    """
    # Look for "Table A3 Descriptive statistics..."
    start = text.find('Table A3 Descriptive statistics')
    if start == -1:
        start = text.rfind('Table A3')

    if start == -1:
        return None

    # Find the end: Table A4 (but not "Table A4 Descriptive")
    end = len(text)
    pos = start
    while pos < len(text):
        idx = text.find('Table A4', pos)
        if idx == -1:
            break
        next_text = text[idx:idx+50]
        if 'Descriptive' not in next_text[:20]:
            end = idx
            break
        pos = idx + 10

    return text[start:end]

def main():
    years = [2019, 2020, 2021, 2022, 2023, 2024]
    base_dir = '/Users/matthew/how does scaling work'
    all_data = {}

    for year in years:
        if year == 2024:
            pdf_path = f'{base_dir}/scaling-report-2024-nsw-hsc.pdf'
        else:
            pdf_path = f'{base_dir}/scaling-data/scaling-report-{year}.pdf'

        if not os.path.exists(pdf_path):
            print(f"PDF not found: {pdf_path}")
            continue

        print(f"Processing {year}...")

        try:
            text = extract_text_from_pdf(pdf_path)

            # Find Table A3 section
            table_a3_text = extract_table_a3_section(text)

            if table_a3_text:
                courses = parse_table_a3(table_a3_text, year)
                print(f"  Found {len(courses)} courses in Table A3")

                # Count courses with scaled data
                with_scaled = sum(1 for c in courses if 'scaled' in c)
                print(f"  {with_scaled} courses have scaled data")

                # Show first 5 courses
                for c in courses[:5]:
                    scaled_str = f", scaled mean={c['scaled']['mean']}" if 'scaled' in c else " (no scaled)"
                    print(f"    - {c['course']}: HSC mean={c['hsc']['mean']}{scaled_str}")
            else:
                courses = []
                print(f"  Could not find Table A3 for {year}")

            # Find Table A9
            table_a9_start = text.rfind('Table A9')
            if table_a9_start > 0:
                table_a9_text = text[table_a9_start:table_a9_start+3000]
                mappings = parse_table_a9(table_a9_text)
                print(f"  Found {len(mappings)} ATAR mappings in Table A9")
            else:
                mappings = []
                print(f"  Could not find Table A9 for {year}")

            all_data[str(year)] = {'table_a3': courses, 'table_a9': mappings}

        except Exception as e:
            print(f"Error processing {year}: {e}")
            import traceback
            traceback.print_exc()

    # Save output
    output_path = f'{base_dir}/scaling-data/scaling-data.json'
    with open(output_path, 'w') as f:
        json.dump(all_data, f, indent=2)

    print(f"\nData saved to {output_path}")

if __name__ == '__main__':
    main()