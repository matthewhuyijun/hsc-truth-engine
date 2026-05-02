# HSC Truth Engine - Data Inventory

## Quick Summary

| Dataset | Years | Files | Location |
|---------|-------|-------|----------|
| Distinguished Achievers | 2017-2025 | 9 CSV | `data/csv/distinguished-achievers/` |
| Distinguished Achievers | 2001-2016 | 16 JSON | `data/csv/archive-distinguished/` |
| All Rounders | 2017-2025 | 9 CSV | `data/csv/all-round-achievers/` |
| All Rounders | 2001-2016 | 16 JSON | `data/csv/archive-all-rounders/` |
| First in Course | 2017-2025 | 9 CSV | `data/csv/first-in-course/` |
| First in Course | 2001-2016 | 16 JSON | `data/csv/archive-first-in-course/` |
| Top Achievers | 2017-2025 | 9 CSV | `data/csv/top-achievers/` |
| Top Achievers | 2001-2016 | 15 JSON | `data/csv/archive-top-achievers/` |
| Student Entries by Sex | 1991-2025 | 35 JSON | `data/csv/student-entries-by-sex/` |
| Band Performance (summary) | 2001-2011 | 11 JSON | `data/csv/band-performance/` |
| Band Performance (detail) | 2012-2025 | 14 JSON | `data/csv/band-performance-detail/` |

---

## Data Formats

### Distinguished Achievers (2017-2025)
```csv
year,first_name,last_name,main_school_name,top_band_courses
2025,Sanya,Aamir,Al-Faisal College,"15232 - Mathematics Standard 1 Examination"
2025,Emily,Abadee,Pymble Ladies' College,"15140 - English Advanced; 15220 - Legal Studies"
```

### Distinguished Achievers (2001-2016) - Archive Format
```json
[
  ["Student name", "School name", "Top band courses"],
  ["Aamir, Aniqa", "Malek Fahd Islamic School", "15240 - Mathematics 15330 - Physics"],
  ["Aaron, Divine", "Willoughby Girls High School", "15140 - English (Advanced)"]
]
```

### All Rounders (2017-2025)
```csv
year,first_name,last_name,main_school_name,courses
2025,James,Smith,James Ruse Agricultural College,"Mathematics Extension 2; Mathematics Extension 1; ..."
```

### First in Course (2017-2025)
```csv
year,first_name,last_name,main_school_name,course_name,course_code
2025,Name,Name,School Name,Course Name,12345
```

### Top Achievers (2017-2025)
```csv
year,first_name,last_name,main_school_name,achievement
2025,Name,Name,School Name,Achievement description
```

### Student Entries by Sex (1991-2025)
```json
[
  ["Course name", "Units/Hours", "Male", "Female", "Non-binary", "Total"],
  ["Aboriginal Studies 2 unit (15000)", "2", "240", "587", "0", "827"],
  ["Agriculture 2 unit (15010)", "2", "724", "786", "0", "1510"]
]
```

### Band Performance Summary (2001-2011)
```json
[
  ["Course name", "Units/Hours", "Male", "Female", "Non-binary", "Total"],
  ["Course Name", "2", "100", "200", "0", "300"]
]
```

### Band Performance Detail (2012-2025)
```json
{
  "year": 2025,
  "course": "English Advanced",
  "Band 6": 11.25,
  "Band 5": 23.58,
  "Band 4": 22.61,
  "Band 3": 18.26,
  "Band 2": 13.3,
  "Band 1": 11
}
```

---

## Data Sources

| Source | URL Pattern | Years |
|--------|-------------|-------|
| NSW Government | `nsw.gov.au/education-and-training/nesa/...` | 2017-2025 |
| Board of Studies Archive | `boardofstudies.nsw.edu.au/ebos/static/...` | 2001-2016 |

---

## Scraping Scripts

| Script | Purpose |
|--------|---------|
| `scripts/scrape-archive.mjs` | Merit Lists from BOS Archive (2001-2016) |
| `scripts/scrape-stats.mjs` | Student Entries & Band Performance (2001-2011) |
| `scripts/scrape-band-performance.mjs` | Band Performance from dynamic pages (2012-2025) |

---

## Notes

- **2017-2025 Merit Lists**: Downloaded as CSV with clean column headers
- **2001-2016 Merit Lists**: Downloaded as JSON arrays (raw HTML table format)
- **Band Performance 2012-2025**: Each course has its own page with expandable band descriptions
- **Student Entries by Sex**: Includes both Board Developed and Non-Board Developed courses