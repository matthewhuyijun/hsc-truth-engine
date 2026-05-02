#!/usr/bin/env python3
"""Quick fix for 2023 - different format: HSC/scaled (capital S)"""

import subprocess
import json

text = subprocess.run(['pdftotext', '-layout', 'scaling-data/scaling-report-2023.pdf', '-'], capture_output=True, text=True).stdout

# Find Table A3 section
start = text.find('Appendix – Table A3 Descriptive')
if start == -1:
    start = text.rfind('Table A3 Descriptive')

# Find end (Table A4)
end = text.find('Table A4', start)
section = text[start:end]

# Parse courses
courses = []
current = None
for line in section.split('\n'):
    line = line.strip()
    if not line:
        continue

    # Check for HSC line (capital)
    if 'HSC' in line:
        parts = line.split()
        # Find number
        for i, p in enumerate(parts):
            p = p.replace(',', '')
            if p.isdigit() and int(p) >= 100:
                course_name = ' '.join(parts[:i])
                num = int(p)
                # Find HSC position
                for j in range(i+1, len(parts)):
                    if parts[j] == 'HSC':
                        try:
                            current = {
                                'course': course_name,
                                'number': num,
                                'hsc': {
                                    'mean': float(parts[j+1]),
                                    'sd': float(parts[j+2]),
                                    'max': float(parts[j+3]),
                                    'p99': float(parts[j+4]),
                                    'p90': float(parts[j+5]),
                                    'p75': float(parts[j+6]),
                                    'p50': float(parts[j+7]),
                                    'p25': float(parts[j+8])
                                }
                            }
                        except:
                            current = None
                        break
                break
    # Check for scaled line (scaled continuation)
    elif current and 'scaled' in line.lower():
        parts = line.split()
        # scaled is usually at position 0 or 1
        for i, p in enumerate(parts):
            if p.lower() == 'scaled':
                try:
                    current['scaled'] = {
                        'mean': float(parts[i+1]),
                        'sd': float(parts[i+2]),
                        'max': float(parts[i+3]),
                        'p99': float(parts[i+4]),
                        'p90': float(parts[i+5]),
                        'p75': float(parts[i+6]),
                        'p50': float(parts[i+7]),
                        'p25': float(parts[i+8])
                    }
                    courses.append(current)
                    current = None
                except:
                    pass
                break

print(f"Parsed {len(courses)} courses")
for c in courses[:5]:
    print(f"  - {c['course']}: mean={c['hsc']['mean']}, scaled_mean={c['scaled']['mean']}")

# Save to temp file
with open('temp_2023.json', 'w') as f:
    json.dump(courses, f, indent=2)
print("Saved to temp_2023.json")