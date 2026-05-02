#!/usr/bin/env python3
"""Extract Table A3 and Table A9 from UAC Scaling Reports - improved parser."""

import subprocess
import json
import os
import re

def extract_text_from_pdf(pdf_path):
    result = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], capture_output=True, text=True)
    return result.stdout

def parse_table_a3(text, year):
    """Parse Table A3 from the extracted text."""
    lines = text.split('\n')
    courses = []
    current_course = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip header/notes lines
        if 'Table A3' in line or 'Descriptive' in line:
            continue
        if 'Type of' in line and 'mark' in line:
            continue
        if 'Course' in line and 'Number' in line:
            continue
        if stripped.startswith('Notes:') or stripped.startswith('(i)') or stripped.startswith('(ii)'):
            continue
        if re.match(r'^\d+$', stripped):  # Page numbers
            continue
        if 'Appendix' in stripped:
            continue

        # Check for scaled continuation line
        first_word = stripped.split()[0].lower() if stripped.split() else ''
        if first_word == 'scaled':
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
                except:
                    pass
            continue

        # Try to find number + HSC pattern
        parts = stripped.split()

        # Find number (student count)
        num_idx = -1
        for j, part in enumerate(parts):
            cleaned = part.replace(',', '')
            if cleaned.isdigit() and 100 <= int(cleaned) <= 100000:
                num_idx = j
                break

        if num_idx == -1:
            continue

        if num_idx + 1 >= len(parts):
            continue

        mark_type = parts[num_idx + 1].lower()
        if mark_type != 'hsc':
            continue

        # Extract course name (before the number)
        course_name = ' '.join(parts[:num_idx])
        num = int(parts[num_idx].replace(',', ''))

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
                    'mean': hsc_mean, 'sd': hsc_sd, 'max': hsc_max,
                    'p99': hsc_p99, 'p90': hsc_p90, 'p75': hsc_p75, 'p50': hsc_p50, 'p25': hsc_p25
                }
            }
        except:
            current_course = None
            continue

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
    # Different PDF versions have different header formats
    # Look for various patterns

    # Pattern 1: "Table A3 Descriptive statistics..."
    start = text.find('Table A3 Descriptive statistics')
    if start == -1:
        # Pattern 2: just "Table A3"
        start = text.rfind('Table A3')

    if start == -1:
        return None

    # Find the end: Table A4 (not "Table A4 Descriptive" which is different)
    # Look for "Table A4" but not followed by "Descriptive"
    end = len(text)

    # Search for Table A4 marker
    pos = start
    while pos < len(text):
        idx = text.find('Table A4', pos)
        if idx == -1:
            break
        # Check if this is followed by "Descriptive" (which means it's still A3 section header)
        # or is followed by space then a number (which means it's a data table)
        next_text = text[idx:idx+50]
        if 'Descriptive' not in next_text[:20]:
            end = idx
            break
        pos = idx + 10

    return text[start:end]

def main():
    years = [2020, 2021, 2022]  # Test on these first
    base_dir = '/Users/matthew/how does scaling work'
    results = {}

    for year in years:
        pdf_path = f'{base_dir}/scaling-data/scaling-report-{year}.pdf'

        if not os.path.exists(pdf_path):
            print(f"PDF not found: {pdf_path}")
            continue

        print(f"\n{'='*50}")
        print(f"Processing {year}...")

        try:
            text = extract_text_from_pdf(pdf_path)

            # Find Table A3 section
            section = extract_table_a3_section(text)

            if section:
                print(f"  Found Table A3 section ({len(section)} chars)")
                # Count how many course lines
                course_lines = [l for l in section.split('\n') if 'HSC' in l and l.strip().split()[-1].replace('.','').isdigit()]
                print(f"  Found ~{len(course_lines)} course lines")

                # Debug: show first few lines
                print("\n  First 500 chars:")
                print(section[:500])
            else:
                print("  Could not find Table A3 section!")
                # Try to find any occurrence of "Table A3"
                all_a3 = [i for i in range(len(text)) if text[i:i+7] == 'Table A3']
                print(f"  Found {len(all_a3)} 'Table A3' occurrences")
                for pos in all_a3[:3]:
                    print(f"    At position {pos}: {text[pos:pos+100]}")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()