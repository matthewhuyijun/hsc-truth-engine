# The Statistical Architecture of the NSW HSC and ATAR

**A Comprehensive Analysis Derived Exclusively from Official Sources**

---

## Table of Contents

1. [Introduction: The Two-Component System](#1-introduction-the-two-component-system)
2. [Preliminary Requirements and Eligibility](#2-preliminary-requirements-and-eligibility)
3. [Step 1: The HSC Examination — Production and Marking](#3-step-1-the-hsc-examination--production-and-marking)
4. [Step 2: Generating Raw Marks](#4-step-2-generating-raw-marks)
5. [Step 3: School Assessment Moderation — The Quadratic Transformation](#5-step-3-school-assessment-moderation--the-quadratic-transformation)
6. [Step 4: Alignment to Performance Standards](#6-step-4-alignment-to-performance-standards)
7. [Step 5: The HSC Mark — The Final NESA Output](#7-step-5-the-hsc-mark--the-final-nesa-output)
8. [Step 6: Entering UAC Territory — Raw Marks for Scaling](#8-step-6-entering-uac-territory--raw-marks-for-scaling)
9. [Step 7: The Scaling Algorithm — Full Mathematical Derivation](#9-step-7-the-scaling-algorithm--full-mathematical-derivation)
10. [Step 8: Aggregate Calculation](#10-step-8-aggregate-calculation)
11. [Step 9: The One-Parameter Cubic Spline — ATAR from Aggregate](#11-step-9-the-one-parameter-cubic-spline--atar-from-aggregate)
12. [Step 10: The ATAR Advice Notice](#12-step-10-the-atar-advice-notice)
13. [Comprehensive Statistical Evidence from 2024](#13-comprehensive-statistical-evidence-from-2024)
14. [Common Questions Answered with Mathematical Rigor](#14-common-questions-answered-with-mathematical-rigor)
15. [Source Index — Every Official Reference](#15-source-index--every-official-reference)

---

## 1. Introduction: The Two-Component System

NSW operates a **dual-reporting system** for Year 12 achievement:

| Component | Issued by | Nature | Purpose |
|---|---|---|---|
| **HSC** (Higher School Certificate) | **NESA** (NSW Education Standards Authority) | Standards-referenced credential | Reports what a student knows and can do against fixed syllabus standards |
| **ATAR** (Australian Tertiary Admission Rank) | **UAC** (Universities Admissions Centre) | Norm-referenced rank | Ranks students for university admission across different subject combinations |

**Critical Distinction (UAC, 2025):** The HSC is your *time* in a race (not compared to anyone else); the ATAR is your *place* (first, second, third, and so on). There is no quota limiting how many students can achieve Band 6 in the HSC; the ATAR, by contrast, *is* a quota-based rank.

**Source:** UAC, "ATAR - Australian Tertiary Admission Rank" (https://www.uac.edu.au/future-applicants/atar); UAC, "How your ATAR is calculated" (https://www.uac.edu.au/future-applicants/atar/how-your-atar-is-calculated); UAC, "Report on the Scaling of the 2024 NSW Higher School Certificate" (hereafter **"Scaling Report 2024"**), p. ii.

---

## 2. Preliminary Requirements and Eligibility

### 2.1 HSC Eligibility (NESA ACE Rules)

To qualify for the HSC, a student must complete:
- At least **12 units** of Preliminary courses
- At least **10 units** of HSC courses, including:
  - At least **six units** of Board Developed courses
  - At least **two units** of a Board Developed course in English
  - At least **three courses** of two-unit value or greater (Board Developed or Board Endorsed)
  - At least **four subjects**

Since 2020, students must also meet **minimum literacy and numeracy standards**.

**Source:** Scaling Report 2024, Section 1.1, p. 02.

### 2.2 ATAR Eligibility (2024)

To be eligible for an ATAR, a student must have satisfactorily completed at least **10 units of ATAR courses**, including:
- At least **eight units of Category A courses**
- At least **two units of English**
- At least **three courses** of two units or greater
- At least **four subjects**

**Category A vs B (2024):** Category A courses have academic rigour and depth. Category B courses (e.g., VET framework exams, English Studies, Mathematics Standard 1) are limited to contributing a maximum of **2 units** to the ATAR aggregate.

**2025 Reform:** The categorisation of ATAR courses into Category A and B will be **abolished** in 2025. All Board Developed courses with examinations will be treated equally.

**Source:** Scaling Report 2024, Sections 2.2–2.4, pp. 04–05.

---

## 3. Step 1: The HSC Examination — Production and Marking

### 3.1 Examination Development (NESA)

HSC examinations are designed to allow students to demonstrate knowledge across the **entire breadth** of a syllabus. The Examination Committee develops:
- Examination papers
- Marking guidelines according to set principles

**Source:** NESA, "Exam marking process" (https://www.nsw.gov.au/education-and-training/nesa/hsc/exams-and-marking/marking-process).

### 3.2 Marking Workforce

Approximately **5,500 experienced Year 12 teachers** serve as HSC markers annually. Structure:
- **Supervisors of Marking**: overall responsibility for a course/part of exam
- **Senior Markers**: lead teams focused on specific questions
- **Markers**: individual teachers who mark responses

On average, **8 different markers** will mark a single student's exam paper.

**Source:** NESA, "Exam marking process."

### 3.3 Practice Marking and Quality Assurance

Before actual marking begins:
1. Teams attend training sessions and receive briefings on applying marking guidelines
2. Discuss typical responses at different mark levels
3. Practice-mark a variety of responses to demonstrate consistent application
4. Senior Markers review the marks and patterns from each marker
5. Practice continues until Senior Markers are confident of accuracy and consistency

**Source:** NESA, "Exam marking process."

### 3.4 Marking by Question Type

**Short-response questions** (one word/number to 1-2 pages):
- A single marker marks
- Senior Markers use: check marking, common scripts, statistical reports

**Extended-response questions** (essays, creative writing, projects, performances):
- **Double marking**: Two markers independently assign marks
- If marks differ considerably, a Senior Marker resolves the discrepancy

**Source:** NESA, "Exam marking process."

### 3.5 Consistency Monitoring During Marking

- **Check marking**: Reviewing a sample of each marker's work
- **Common script marking**: All team members mark the same response; reviewed for major differences
- **Statistical reports**: Checking each marker's pattern of marks in a session
- If inconsistencies are found, the marker is re-briefed

**Source:** NESA, "Exam marking process."

### 3.6 Optional Question Scaling and Weighting

For exams with optional questions: initial raw marks may be adjusted to compensate for question difficulty — ensuring students are not unfairly advantaged/disadvantaged by choosing easier/harder options.

For exams with components marked out of different values than their worth: a **weighting factor** is applied (e.g., Music 1 practical tasks marked out of 20 but worth 17.5%).

**Source:** NESA, "Exam marking process."

---

## 4. Step 2: Generating Raw Marks

After marking is complete, NESA calculates a **total raw examination mark** for each student in each examined course by adding marks for each question/task after optional question scaling and weighting.

These **raw examination marks** are the first critical data point. They are:
- **Not reported to students**
- Used as input to the moderation process (Step 3)
- Used as input to the alignment process (Step 4)
- Used as input to the scaling process (Step 7)

**Source:** NESA, "Exam marking process"; NESA, "Determining HSC results" (https://www.nsw.gov.au/education-and-training/nesa/hsc/results-and-certificates/determining-results).

---

## 5. Step 3: School Assessment Moderation — The Quadratic Transformation

### 5.1 Why Moderation Is Necessary

The school-based assessment contributes **50%** of the final HSC mark. However, each school designs its own assessment tasks and applies its own marking standards. A mark of 90 at one school cannot be directly compared to a 90 at another — the conditions are not identical.

The **only common task** that all students in a course complete under identical conditions is the HSC examination. Therefore, the examination provides the **anchor** to place school assessments on a common scale.

**Source:** NESA, "Assessment moderation" (https://www.nsw.gov.au/education-and-training/nesa/hsc/exams-and-marking/assessment-moderation).

### 5.2 The Three-Point Anchor System

For each **school-course group**, NESA establishes three mathematical anchor points:

1. **Group Highest Mark**: The highest school assessment mark in the group is adjusted to equal the highest raw HSC examination mark achieved by any student in that group.
2. **Group Mean**: The mean (average) of the school assessment marks is adjusted to equal the mean of the group's raw HSC examination marks.
3. **Group Lowest Mark**: Where mathematically possible, the lowest school assessment mark is adjusted to equal the lowest raw HSC examination mark.

If two or more students are tied at the top of internal ranks, NESA moderates their mark to the **mean** of the highest examination marks achieved by those tied students. Same logic applies to ties at the lowest rank.

**Source:** NESA, "Assessment moderation."

### 5.3 The Quadratic Transformation Function

For students between the anchor points, NESA uses a **non-linear quadratic polynomial function** (designed by Dr. Robert MacCann), **not** a simple linear shift.

The quadratic curve preserves:
- The **rank order** of students as determined by the school
- The **relative gaps** between students as determined by the school

If Student A and Student B were separated by a large gap in school assessments, they remain separated by a proportional gap after moderation — even if their actual examination scores on the day were very close.

**Mathematical consequence**: A student's moderated assessment mark is determined by:
1. Their **rank** within their school
2. The **performance of the entire school cohort** in the examination

It is NOT determined by their own individual exam mark.

**Source:** NESA, "Assessment moderation."

### 5.4 Worked Moderation Example (NESA Official)

Consider a school-course group of 6 students:

| Student | Exam Mark /50 | Moderated Assessment /50 | School Assessment /50 | Assessment Rank | Exam Rank |
|---|---|---|---|---|---|
| A | 46 | 46 | **90** → 92 | 1 | 1 |
| B | 36 | 38.5 | **78** → 77 | 2 | 3 |
| C | 40 | 36.9 | **75** → 74 | 3 | 2 |
| D | 30 | 29.5 | **58** → 59 | 4 | 4 |
| E | 25 | 28.5 | **55** → 57 | 5 | 6 |
| F | 27.5 | 25 | **40** → 50 | 6 | 5 |

Changes during moderation:
- Group mean assessment mark: 66 → 68 (matches exam mean)
- Highest assessment mark: 90 → 92 (matches highest exam mark)
- Lowest assessment mark: 40 → 50 (matches lowest exam mark)
- **Rank order preserved**
- **Relative gaps preserved** (students B/C remain close; D/E remain close)

**Source:** NESA, "Assessment moderation."

### 5.5 Atypical Performance Exclusions

To protect the integrity of moderation, NESA excludes students with **atypical examination performances**:
- Students with an upheld illness/misadventure application where the exam mark is lower than expected
- Students whose exam mark is statistically significantly lower than their school assessment would predict

Excluded students still receive a moderated mark, but the anchor points are calculated using the **regular** members of the group only.

**Source:** NESA, "Assessment moderation."

---

## 6. Step 4: Alignment to Performance Standards

### 6.1 What Is Alignment?

The **raw examination mark** is not the mark reported to students. Alignment is the process of mapping raw marks onto the 0–100 HSC reporting scale, anchored to **performance band descriptions** that define what students at each level know and can do.

This is a **standards-referenced** process — there are **no quotas**. If every student in the state meets the Band 6 standard, every student can receive a mark of 90 or above.

**Source:** NESA, "Determining HSC results."

### 6.2 The Four-Stage Standards-Setting Process

**Stage 1 — Independent Judging:**
- Expert judges review each question and determine the mark a borderline student would receive for each band cut-off
- Judges' individual recommendations are averaged to get the team's first set of estimated cut-off marks

**Stage 2 — Team Discussion:**
- Judges review statistics on how students at different attainment levels performed on each question
- Judges may adjust their earlier recommendations
- Modified cut-off marks are averaged to get the second set of estimates

**Stage 3 — Refinement and Recommendation:**
- Judges review actual student responses at or near each cut-off mark
- Further refinement as needed
- Recommended cut-off marks are sent to the HSC Standards Committee

**Stage 4 — HSC Standards Committee Review:**
- An expert committee of leading NSW authorities in educational measurement reviews the judges' work
- Final cut-off marks are decided
- Any anomalies in the exam, marking, or standards-setting processes are addressed

**Source:** NESA, "Determining HSC results."

### 6.3 The Interpolation Formula

Once cut-off marks are finalised, NESA maps raw marks to the reporting scale:

| Band Cut-off | Raw Mark → Aligned Mark |
|---|---|
| Band 6 cutoff | Raw mark → 90 |
| Band 5 cutoff | Raw mark → 80 |
| Band 4 cutoff | Raw mark → 70 |
| Band 3 cutoff | Raw mark → 60 |
| Band 2 cutoff | Raw mark → 50 |
| Maximum raw | Raw mark → 100 |
| Minimum raw | Raw mark → 0 |

For marks between cut-offs, **linear interpolation** is used:

```
Aligned Mark = 90 + (Raw Mark - Band_6_Raw_Cutoff) × (100 - 90) / (Max_Raw - Band_6_Raw_Cutoff)  [above Band 6]
```

```
Aligned Mark = Band_Lower + (Raw Mark - Raw_Lower) × (Band_Upper - Band_Lower) / (Raw_Upper - Raw_Lower)  [between cut-offs]
```

**Worked example (NESA official):**
- Band 6 cutoff = raw 82, Band 5 cutoff = raw 74
- Student with raw 82 → aligned exam mark of 90
- Student with raw 74 → aligned exam mark of 80
- Student with raw 78 → aligned exam mark of 85 (linear interpolation: 80 + (78-74) × 10/8)

For Extension courses (except Math Ext 2):
- E4 cutoff → 45, E3 cutoff → 35, E2 cutoff → 25

**Source:** NESA, "Determining HSC results."

### 6.4 Performance Band Structure

| Band | 2-Unit Mark Range | Extension Mark Range (except Math Ext 2) | Math Ext 2 Mark Range |
|---|---|---|---|
| Band 6 / E4 | 90–100 | 45–50 | 90–100 |
| Band 5 / E3 | 80–89 | 35–44 | 70–89 |
| Band 4 / E2 | 70–79 | 25–34 | 50–69 |
| Band 3 / E1 | 60–69 | 0–24 | 0–49 |
| Band 2 | 50–59 | N/A | N/A |
| Band 1 | 0–49 | N/A | N/A |

**Source:** Scaling Report 2024, Section 1.2.1, p. 03.

---

## 7. Step 5: The HSC Mark — The Final NESA Output

The final **HSC Mark** for a course is:

```
HSC Mark = round_up((Moderated Assessment Mark + Aligned Examination Mark) / 2)
```

Half-marks are rounded **up**. Example (NESA official): exam mark 92 + assessment mark 89 = 90.5, rounded to 91.

The HSC mark determines the student's **performance band**.

NESA reports to students:
- Examination mark (aligned)
- School assessment mark (moderated and aligned)
- HSC mark (average of the above)
- Performance band

**Source:** Scaling Report 2024, Section 1.2.4, pp. 02–03; NESA, "Determining HSC results."

---

## 8. Step 6: Entering UAC Territory — Raw Marks for Scaling

**Critical point**: UAC does NOT use the aligned HSC marks for scaling. UAC uses:

```
Raw HSC Mark (per course) = (Raw Examination Mark + Raw Moderated Assessment Mark) / 2
```

Where:
- **Raw Examination Mark**: the actual mark from the exam, before alignment to performance bands
- **Raw Moderated Assessment Mark**: the school assessment after moderation (Step 3), but before alignment to performance bands

NESA supplies these raw marks to UAC. Students **never see** their raw marks.

**Source:** Scaling Report 2024, Section 3.1, pp. 07–08; UAC, "How your ATAR is calculated."

---

## 9. Step 7: The Scaling Algorithm — Full Mathematical Derivation

### 9.1 The Fundamental Principle

The scaling algorithm's core axiom (UAC):

> A student should be **neither advantaged nor disadvantaged** by choosing one HSC course over another.

The algorithm estimates what a student's marks would have been **if all courses had been studied by all students and all courses had the same mark distribution**.

**Source:** Scaling Report 2024, Section 3.1, p. 07; UAC, "5 facts about scaling" (https://www.uac.edu.au/media-centre/news/5-facts-about-scaling).

### 9.2 The Mathematical Model

The scaling model assumes that a student's position in a course depends on:
1. The student's **developed ability** in that course
2. The **strength of the competition**

"Strength of competition" is defined as the **demonstrated overall academic attainment** of the course candidature — measured by how those students perform in all their other subjects.

### 9.3 Step 7a: Combined Courses

Before scaling begins, certain courses are combined:

- **English Studies, English Standard, English Advanced**: Placed on a common calibrated raw mark scale by NESA using shared examination questions (20 marks common in 2024). Scaled as a single course.
- **Hospitality (two streams)**: Scaled as a single course.

**Source:** Scaling Report 2024, Section 3.2.3, p. 08; Section 5.2, p. 22.

### 9.4 Step 7b: Initial Standardisation

A **linear transformation** is applied to all raw HSC marks:

1. Set the top mark in each course to a common value
2. Standardise each course to a **mean of 25 and standard deviation of 12** on a one-unit basis

This initial standardisation ensures all courses start from comparable baselines before the iterative scaling begins.

**Source:** Scaling Report 2024, Section 3.2.4, p. 08.

### 9.5 Step 7c: The Simultaneous Equations — Computing Scaled Means

The core scaling model specifies:

For each 2-unit course \(j\):

$$\mu_j^{\text{scaled}} = \frac{1}{n_j} \sum_{i \in \text{course } j} \bar{s}_i$$

Where:
- \(\mu_j^{\text{scaled}}\) is the **scaled mean** for course \(j\)
- \(n_j\) is the number of students in course \(j\)
- \(\bar{s}_i\) is the **average scaled mark** of student \(i\) across ALL their courses (their measure of overall academic achievement)

Similarly, the **scaled standard deviation** \(\sigma_j^{\text{scaled}}\) for course \(j\) is the standard deviation of \(\bar{s}_i\) across the course candidature.

This creates a **system of simultaneous equations** — the scaled mean for each course depends on the scaled means of all other courses (through \(\bar{s}_i\)). The solution is found **iteratively** until convergence.

**Source:** Scaling Report 2024, Section 3.2.5, pp. 08–09.

### 9.6 Step 7d: Extension Course Scaling Rules

Extension courses do **not** solve their own simultaneous equations. Instead:

- **English Extension 1 and Mathematics Extension 1**: Scaled means and SDs determined by performance of those students in the corresponding **2-unit parent course** (English Advanced / Mathematics Advanced)
- **Mathematics Extension 2**: Scaled mean and SD determined by performance of Math Ext 2 students in **Mathematics Extension 1**
- **English Extension 2**: Scaled mean and SD determined by performance in **English Advanced** (since Ext 2 students don't complete a separate Math Advanced paper, unlike Math)
- **History Extension**: Weighted average of scaled means derived from Modern History and Ancient History parent courses
- **Science Extension**: Weighted average of scaled means from up to five 2-unit science parent courses

**Source:** Scaling Report 2024, Section 3.2.5, pp. 08–09.

### 9.7 Step 7e: Setting Maximum Scaled Marks

The **benchmark** is the combined 2-unit English candidature, for which the maximum scaled mark is always **50 per unit**.

For other courses, the maximum scaled mark is:

$$\text{MaxScaled}_j = \min\left(50, \ \mu_j^{\text{scaled}} + k \times \sigma_j^{\text{initial}}\right)$$

Where \(k\) is calculated afresh each year. In **2024, \(k = 2.47\)**.

**Source:** Scaling Report 2024, Section 3.2.6, p. 09.

### 9.8 Step 7f: Non-Linear Transformation of Individual Marks

Once \(\mu_j^{\text{scaled}}\) and \(\sigma_j^{\text{scaled}}\) are determined, individual raw marks are scaled using a **non-linear transformation** which:

1. Preserves the scaled mean and standard deviation
2. Restricts scaled marks to the range (0, 50) per unit
3. **Preserves the ranking of students within each course** (monotonic transformation)

If the non-linear transformation results in a maximum scaled mark below the cap from Step 7e, a further **linear transformation** is applied to increase the SD so the actual maximum matches the cap. This further transformation does **not** change the scaled mean.

For very small candidatures, alternative transformations consistent with the scaling principles are used.

**Source:** Scaling Report 2024, Section 3.2.7, p. 09.

### 9.9 Scaling Does NOT Change Within-Course Ranking

**Critical:** The scaling transformation is strictly order-preserving within each course. If you are ranked #1 in your course, you will receive the highest scaled mark in that course. If you are ranked #50, you will receive the 50th highest scaled mark.

**Source:** Scaling Report 2024, Section 3.1, p. 07; UAC, "5 facts about scaling."

### 9.10 2024 Scaled Means — Selected Courses

| Course | Enrolment (2024) | Scaled Mean (per unit) | Scaled SD | Max Scaled Mark |
|---|---|---|---|---|
| Mathematics Extension 2 | 3,544 | 43.4 | 5.0 | 50.0 |
| Mathematics Extension 1 | 8,846 | 39.6 | 7.2 | 50.0 |
| Chinese Extension | 73 | 38.1 | 4.9 | 50.0 |
| Japanese Extension | 146 | 37.5 | 5.3 | 50.0 |
| English Extension 1 | 3,782 | 36.2 | 6.2 | 50.0 |
| English Extension 2 | 1,479 | 35.2 | 5.9 | 50.0 |
| German Continuers | 770 | 34.6 | 8.3 | 50.0 |
| Chemistry | 9,722 | 31.8 | 9.9 | 50.0 |
| English Advanced | 25,397 | 32.7 | 8.1 | 50.0 |
| Physics | 8,215 | 31.1 | 9.8 | 50.0 |
| Economics | 5,598 | 31.5 | 9.6 | 50.0 |
| Biology | 18,835 | 26.0 | 10.2 | 50.0 |
| Modern History | 10,590 | 25.2 | 11.0 | 50.0 |
| Business Studies | 19,570 | 23.5 | 11.4 | 50.0 |
| Mathematics Advanced | 16,559 | 32.0 | 9.0 | 50.0 |
| Mathematics Standard 2 | 31,140 | 22.8 | 10.3 | 46.8 |
| English Standard | 32,992 | 20.1 | 8.2 | 47.7 |
| Retail Services Exam | 725 | 16.8 | 10.8 | 43.3 |
| Mathematics Standard 1 Examination | 2,139 | 13.4 | 9.6 | 43.2 |
| Aboriginal Studies | 734 | 15.1 | 12.4 | 47.0 |
| Industrial Technology | 4,968 | 17.6 | 12.1 | 47.0 |
| Community & Family Studies | 9,523 | 18.4 | 11.4 | 48.8 |

**Source:** Scaling Report 2024, Table A3, pp. 41–46.

---

## 10. Step 8: Aggregate Calculation

### 10.1 The Aggregate Formula

For each ATAR-eligible student, UAC calculates:

$$\text{Aggregate} = \sum (\text{Best 2 units of English}) + \sum (\text{Best 8 units from remaining subjects})$$

- The aggregate is calculated from **scaled marks** (not HSC marks)
- The English requirement must be satisfied from the 2 best units of English
- Maximum possible aggregate in 2024: **500** (capped)
- For Category B courses (2024): no more than 2 units can be included

### 10.2 Example

If English Advanced (2 units) + English Extension 1 (1 unit) = scaled marks of 42.0 and 43.5 per unit, the English component is 42.0 × 2 + 43.5 × 1 (if Ext 1 is the better single unit contributing).

Then the best 8 remaining units are selected from all other courses.

**Source:** Scaling Report 2024, Section 2.4, p. 05.

### 10.3 Aggregate Distribution (2024)

In 2024, there were **4,518 distinct aggregates** among 57,194 ATAR recipients. Some aggregates were shared by 30 or more students.

| Aggregate | ATAR-Eligible Percentile | Corresponding ATAR |
|---|---|---|
| 477.4 | 100.0 | 99.95 |
| 450.0 | 98.6 | 99.20 |
| 400.0 | 90.3 | 94.50 |
| 350.0 | 76.5 | 86.75 |
| 300.0 | 60.4 | 77.60 |
| 250.0 | 43.9 | 67.85 |
| 200.0 | 28.8 | 58.00 |
| 150.0 | 15.4 | 47.85 |

**Source:** Scaling Report 2024, Table 3.1, p. 10; Table A9, p. 62.

---

## 11. Step 9: The One-Parameter Cubic Spline — ATAR from Aggregate

### 11.1 The ATAR Is a Rank, Not a Mark

An ATAR of 80.00 means the student has performed better than **80% of the entire HSC-aged population** (16–20 year olds in NSW), assuming everyone in that age group had completed the HSC and been eligible.

Because the ATAR-eligible cohort is a more academically select group, the average ATAR is consistently **above 50.00** — around **70.00**.

**Source:** UAC, "ATAR - Australian Tertiary Admission Rank"; Scaling Report 2024, Section 2.1, p. 04.

### 11.2 The Participation Rate

The participation rate \(r\) is the proportion of the target population (16–20 year olds) who are ATAR-eligible.

In 2024, for NSW and ACT combined:

$$r = 0.551 \ \text{(55.1%)}$$

Target population size: Determined using **ABS (Australian Bureau of Statistics)** data.

**Source:** Scaling Report 2024, Section 3.2.9, p. 10.

### 11.3 The Cubic Spline Function

Since 2017, all Australian jurisdictions use the **one-parameter cubic spline model** (Harrison and Hyndman, 2015) to convert aggregates into ATARs.

Define \(\alpha\) from the participation rate \(r\):

$$\alpha = 1.5 - 2r$$

In 2024: \(\alpha = 1.5 - 2 \times 0.551 = 0.40\)

The model specifies the **expected proportion** of the population at percentile rank \(x\) who will be ATAR-eligible:

For \(0 \leq x \leq 100\alpha\):

$$P(x) = \frac{x^3}{(1000\alpha)^2}$$

For \(100\alpha \leq x \leq 100\):

$$P(x) = 1 - \frac{(100 - x)^3}{(1000 - 1000\alpha)^2}$$

**Source:** Scaling Report 2024, Section 3.2.9, p. 10.

### 11.4 The 99.95 ATAR Category

The model expects all the most able candidates to complete Year 12. The top category (ATAR 99.95) is designed to contain **1/2000th** of the target population.

In 2024, this target frequency was:

$$N_{99.95} = \frac{\text{NSW+ACT target population}}{2000} = 54 \text{ students}$$

The actual allocation was: **51 NSW students + 2 ACT students = 53 students** with ATAR 99.95.

**Source:** Scaling Report 2024, Section 3.2.9, p. 10.

### 11.5 Implementation Algorithm

Starting with the highest aggregate, candidates are **progressively allocated** to ATAR bands (increments of 0.05) to achieve the cumulative target frequencies without exceeding them. Ties in aggregates are handled through careful allocation.

**Source:** Scaling Report 2024, Section 3.2.9, pp. 10–11.

---

## 12. Step 10: The ATAR Advice Notice

The ATAR Advice Notice (from UAC) includes:
- The student's ATAR
- A list of ATAR courses studied and their categorisation
- How many units of each course were included in the calculation

ATARs below 30.00 are shown as "30 or less." Ineligible students see "Not Eligible."

**Source:** Scaling Report 2024, Section 2.5, p. 06.

---

## 13. Comprehensive Statistical Evidence from 2024

### 13.1 Cohort Size

| Metric | Count |
|---|---|
| HSC candidature (completed ≥1 ATAR course) | 74,291 |
| ATAR-eligible students | 57,194 (77.0%) |
| Students receiving an ATAR | 57,194 |
| Distinct enrolment patterns | 26,138 |
| Patterns unique to one student | 18,859 |
| Students presenting exactly 10 units | 37,546 (65.6%) |

**Source:** Scaling Report 2024, Section 3.1, p. 07; Section 5.3, p. 25.

### 13.2 ATAR Percentiles (2020–2024 Stability)

| Percentile | 2020 ATAR | 2021 ATAR | 2022 ATAR | 2023 ATAR | 2024 ATAR |
|---|---|---|---|---|---|
| 100 (Top) | 99.95 | 99.95 | 99.95 | 99.95 | 99.95 |
| 90 | 94.10 | 94.15 | 94.30 | 94.25 | 94.35 |
| 75 | 85.30 | 85.35 | 85.80 | 85.70 | 85.95 |
| 50 (Median) | 70.15 | 70.40 | 71.25 | 71.05 | 71.55 |
| 30 (approx) | 56.90 | 57.25 | 58.50 | 58.20 | 58.85 |

The **median ATAR in 2024 was 71.55**.

**Source:** Scaling Report 2024, Table A8, p. 62.

### 13.3 Gender Analysis

| Year | Median ATAR (All) | Median ATAR (Female) | Median ATAR (Male) |
|---|---|---|---|
| 2024 | 71.55 | 72.40 | 70.40 |
| 2023 | 71.05 | 71.90 | 70.00 |
| 2022 | 71.25 | 72.45 | 69.85 |
| 2021 | 70.40 | 71.80 | 68.70 |
| 2020 | 70.15 | 71.30 | 68.70 |

**Female students consistently outperform males** in median ATAR. However, at the **very top** (ATAR 99.95), the pattern reverses — in 2024, of the 51 NSW students receiving 99.95, **42 were male and 9 were female**. This correlates with male dominance in high-scaling STEM subjects (Math Ext 2, Physics).

Females comprised **53.6%** of ATAR recipients in 2024 (despite being 48.4% of the HSC-aged population), reflecting higher retention rates and stronger average performance.

**Source:** Scaling Report 2024, Section 4.10, pp. 18–19.

### 13.4 HSC Mark vs Scaled Mark Stability

The scaling process uses **raw** marks, not HSC marks. HSC mark distributions may fluctuate year to year (reflecting differences in student achievement against standards), but **scaled mark distributions remain remarkably stable** — they only change if the overall academic quality of a course candidature changes.

Example — Modern History:
- HSC marks changed noticeably from 2023 to 2024 (e.g., % with mark <30: 15.6% → 9.5%)
- Scaled marks were nearly identical (e.g., % with scaled mark <25: 47.2% → 47.5%)

**Source:** Scaling Report 2024, Section 5.1, pp. 21.

### 13.5 Maximum ATAR by "Low-Scaling" Course

Every course, including those with low scaled means, produces high ATARs:

| Course | Scaled Mean | Max ATAR |
|---|---|---|
| Aboriginal Studies | 15.1 | 99.35 |
| Industrial Technology | 17.6 | 99.90 |
| Community & Family Studies | 18.4 | 99.75 |
| Retail Services Exam | 16.8 | 98.35 |
| Mathematics Standard 1 | 13.4 | 96.30 |

**Source:** Scaling Report 2024, Table A1, pp. 34–37.

### 13.6 English Course Scaling Outcomes

| Course | Enrolment | % Scaled Mark ≥ 20 | % Scaled Mark < 20 |
|---|---|---|---|
| English Advanced | 25,397 | 82.7 | 17.3 → (7.8% below 20) |
| English Standard | 32,992 | 48.5 | 51.5 |
| English Studies Exam | 1,491 | 4.2 | 95.8 |

Despite all three English courses sharing a common calibrated raw mark scale (via 20 marks of common questions), the scaled outcomes diverge dramatically because **the English Advanced candidature performs significantly better in all their other subjects**.

**Source:** Scaling Report 2024, Section 5.2, Table 5.5, pp. 23–24.

### 13.7 Mathematics Course Hierarchy

| Course | Enrolment | Scaled Mean | % Scaled Mark < 20 |
|---|---|---|---|
| Mathematics Extension 2 | 3,544 | 43.4 | 0.4% |
| Mathematics Extension 1 | 8,846 | 39.6 | 2.3% |
| Mathematics Advanced | 16,559 | 32.0 | 11.7% |
| Mathematics Standard 2 | 31,140 | 22.8 | 42.7% |
| Mathematics Standard 1 | 2,139 | 13.4 | 75.1% |

Mathematics Extension 2 is the **only course** in 2024 whose scaled mean (43.4) was significantly higher than the initial standardised mean of 25 — i.e., the only course that "scaled up" on average.

**Source:** Scaling Report 2024, Table A3, pp. 41–46; Table 5.5.

### 13.8 Course Contribution Patterns

Of 108 courses in Table A6, **74** have 70% or more of their students counting the course toward their ATAR. There is **no evidence of systematic differences** across Key Learning Areas in whether courses contribute to the ATAR.

**Source:** Scaling Report 2024, Section 5.3, pp. 25.

---

## 14. Common Questions Answered with Mathematical Rigor

### Q1: Why is my ATAR low compared to my HSC marks?

**Official Answer (UAC/NESA):** The ATAR is a **rank**, not a mark. There is no reason they should be close.

The median HSC mark for most 2-unit courses is between **70 and 80**. The median ATAR is **71.55**. For a typical middle-ranked student, their ATAR will be lower than their average HSC mark because:
- HSC marks are on a standards-referenced scale (0–100)
- ATAR is a percentile rank against the entire age cohort (only ~55% of whom are ATAR-eligible)

There is **no simple rule** to convert HSC marks to ATARs.

**Source:** Scaling Report 2024, Section 6.1, pp. 26–28.

### Q2: How do I know which subject "scales better"?

**Official Answer (UAC):** A course's **scaled mean** tells you about the overall academic quality of its candidature. Courses with high scaled means (e.g., Math Ext 2 at 43.4, Physics at 31.1) attract students who perform strongly across all their subjects. Courses with lower scaled means (e.g., English Standard at 20.1) have more diverse candidatures.

However, UAC explicitly warns against choosing subjects based on scaling:
> "Do not choose courses on the basis of what you believe are the likely effects of scaling. Choice of which courses to study should be determined only by your interests, your demonstrated abilities and the value of courses for your future career plans."

The scaling process is designed to make it safe to choose based on interest and ability.

**Source:** Scaling Report 2024, Section 6.3, p. 31; UAC, "5 facts about scaling."

### Q3: What decides the scaled mean of a subject?

**Official Answer (UAC):** The scaled mean of a course is determined entirely by the **average academic achievement of that course's candidature** — specifically, the average scaled mark those students achieve across **all** their HSC courses. This is solved through a system of simultaneous equations (see Section 9.5).

The scaled mean is:
- **NOT** determined by perceived difficulty of the course
- **NOT** set arbitrarily by UAC
- **NOT** constant from year to year — it changes if the candidature quality changes
- Recalculated **afresh each year**

**Source:** Scaling Report 2024, Section 3.2.5, pp. 08–09.

### Q4: Does the school I attend affect my ATAR?

**Official Answer (UAC):** **No.** The school attended does not feature in the ATAR calculation. The ATAR calculation is based only on marks provided by NESA; no other information is used.

**Source:** Scaling Report 2024, Section 6.3, p. 31.

### Q5: Are certain courses always "scaled down"?

**Official Answer (UAC):** **No.** Scaling is carried out afresh each year. If the quality of the candidature changes, the scaled mean will also change.

However, a course's scaled mean relative to other courses tends to be stable because candidature quality tends to be stable.

**Crucially:** Table A1 shows that every course, including those with low scaled means (e.g., Aboriginal Studies, scaled mean 15.1), has students achieving high ATARs (Aboriginal Studies max ATAR: 99.35).

**Source:** Scaling Report 2024, Section 6.3, p. 31; Table A1, pp. 34–37.

### Q6: Can I get a high ATAR if I study "low-scaling" subjects?

**Official Answer (UAC):** **Yes.** A student who excels in a low-scaling subject will receive a better scaled mark than they would by performing poorly in a high-scaling subject. The scaling process reflects the cohort but does not change an individual's rank within a subject.

The 2024 data shows maximum ATARs of 99.35 (Aboriginal Studies), 99.90 (Industrial Technology), and 99.75 (Community & Family Studies).

**Source:** Scaling Report 2024, Table A1, pp. 34–37.

### Q7: Why does one of my courses count toward my ATAR but another doesn't, even though I got a higher HSC mark in the one that doesn't count?

**Official Answer (UAC):** This is one of the most common enquiries. Three factors determine which courses contribute:

1. **Scaled mean** of the course (the academic quality of the cohort)
2. **Your position** (percentile rank) within each course
3. **Standard deviation** of the course's scaled mark distribution

**Example from 2024 Scaling Report (Example 2):**
- Retail Services Exam: scaled mean = 16.8, SD = 10.8. Student at **P99**, HSC mark = 47.0 per unit → **scaled mark 41.9**
- French Beginners: scaled mean = 23.9, SD = 11.1. Student at **P90**, HSC mark = 47.0 per unit → **scaled mark 39.1**

Even though French Beginners has a higher scaled mean (23.9 vs 16.8), the Retail Services student is at a higher percentile (P99 vs P90), which compensates — they receive the higher scaled mark. **Rank within course can outweigh cohort strength differences.**

**Source:** Scaling Report 2024, Section 6.2, pp. 29–30.

### Q8: How do Liam and Kellie (both at the 50th percentile) get such different ATARs?

**Official Answer (UAC 2024 Scaling Report):**

**Liam's courses**: Drama, English Standard, Music 1, Society & Culture, Studies of Religion II. Average HSC mark per unit: 39.6. Average scaled mean: 23.1. **ATAR: 62.00.**

**Kellie's courses**: Economics, English Advanced, French Beginners, Mathematics Advanced, Physics. Average HSC mark per unit: 39.6. Average scaled mean: 30.2. **ATAR: 81.00.**

Both are at exactly the 50th percentile (the middle) of all their courses. Both have identical average HSC marks. The **19-point ATAR difference** is entirely caused by the difference in the **strength of the competition** in their chosen courses. Kellie's aggregate is approximately 318 vs Liam's approximately 220.

**Conclusion**: Being "middle of the pack" in high-scaling subjects represents a fundamentally higher level of overall academic achievement than being "middle of the pack" in lower-scaling subjects.

**Source:** Scaling Report 2024, Section 6.1, Example 1, pp. 26–27.

### Q9: Why do Fred and Laura, with only a 5-mark difference, have a 20-point ATAR gap?

**Official Answer (UAC 2024 Scaling Report):**

Both take the same six courses. Fred gets 35.0 per unit in each; Laura gets 40.0 per unit.

- **Fred's percentiles**: 4th (English Advanced), 25th (Math Advanced), 32nd (Bio), 38th (Business), 31st (Modern History), 7th (Visual Arts). **ATAR: 57.60.**
- **Laura's percentiles**: 38th (English Advanced), 53rd (Math Advanced), 68th (Bio), 65th (Business), 64th (Modern History), 38th (Visual Arts). **ATAR: 78.30.**

The 5-mark difference per unit produces a **20.70 ATAR difference** because most students achieve marks in the 70–80 range (Band 4). In this crowded part of the distribution, small changes in marks lead to **large shifts in rank**.

**Source:** Scaling Report 2024, Section 6.1, Example 3, pp. 27–28.

### Q10: Can I find out what my scaled marks are?

**Official Answer (UAC):** **No.** Scaled marks are not reported to students. They are determined during an interim phase in the ATAR calculation and exist only as intermediate values.

**Source:** Scaling Report 2024, Section 6.3, p. 31.

### Q11: Does studying more units increase my ATAR?

**Official Answer (UAC):** While data show students who study more units tend to gain higher ATARs, causality is difficult to determine. The relationship might result from personal attributes (interest, motivation, effort, time management). **You cannot assume simply studying more units will increase your ATAR.**

**Source:** Scaling Report 2024, Section 6.3, p. 31.

### Q12: Does my postcode matter?

**Official Answer (UAC):** **No.**

**Source:** Scaling Report 2024, Section 6.3, p. 31.

### Q13: What happens if I repeat a course?

**Official Answer (UAC):** Only the **last satisfactory attempt** is used. Your aggregate may increase, remain the same, or decrease. Since you are compared with a different cohort, your ATAR may also change in any direction.

**Source:** Scaling Report 2024, Section 6.3, p. 31.

### Q14: What about selection rank adjustments? Do they change my ATAR?

**Official Answer (UAC):** **No.** Selection rank adjustments (e.g., for strong performance in specific courses, EAS, location) do **not** change your ATAR. They change your **selection rank** for a particular university course:

$$\text{Selection Rank} = \text{ATAR} + \text{Adjustments}$$

Different universities (and different courses at the same university) apply different adjustment schemes, so your selection rank can differ for each preference.

**Source:** Scaling Report 2024, Section 6.3, pp. 31–32.

### Q15: Why can't I use my HSC marks to check my ATAR calculation?

**Official Answer (UAC):** Two reasons:
1. The ATAR is a **rank**, not an average mark
2. **Raw marks** are used in the ATAR calculation, not the aligned HSC marks reported to students. A given HSC mark usually corresponds to a range of raw marks.

**Source:** Scaling Report 2024, Section 6.3, p. 31.

---

## 15. Source Index — Every Official Reference

### Primary Official Documentation

1. **UAC, "Report on the Scaling of the 2024 NSW Higher School Certificate"** (April 2025)
   - UAC website: https://www.uac.edu.au/assets/documents/scaling-reports/scaling-report-2024-nsw-hsc.pdf
   - The **authoritative** annual report from the Technical Committee on Scaling. Contains all data tables (A1–A9), methodology descriptions, worked examples, and FAQs.

2. **UAC, "Calculating the Australian Tertiary Admission Rank in New South Wales — A Technical Report"**
   - https://www.uac.edu.au/assets/documents/atar/atar-technical-report.pdf
   - Detailed technical documentation of the scaling and ranking methodology.

3. **UAC, "ATAR — Australian Tertiary Admission Rank"**
   - https://www.uac.edu.au/future-applicants/atar
   - Overview of the ATAR system for students and parents.

4. **UAC, "How your ATAR is calculated"**
   - https://www.uac.edu.au/future-applicants/atar/how-your-atar-is-calculated
   - Detailed explanation of scaling, extension courses, accumulation, and repeats.

5. **UAC, "5 facts about scaling"** (12 Dec 2018)
   - https://www.uac.edu.au/media-centre/news/5-facts-about-scaling
   - Concise factual summary of scaling principles.

6. **NESA, "Determining HSC results"**
   - https://www.nsw.gov.au/education-and-training/nesa/hsc/results-and-certificates/determining-results
   - Explanation of alignment, performance bands, and the standards-setting process.

7. **NESA, "Understanding your HSC results"**
   - https://www.nsw.gov.au/education-and-training/nesa/hsc/results-and-certificates/understanding-your-results
   - What students receive and how to interpret it.

8. **NESA, "Exam marking process"**
   - https://www.nsw.gov.au/education-and-training/nesa/hsc/exams-and-marking/marking-process
   - Comprehensive description of the marking operation, quality assurance, and optional question scaling.

9. **NESA, "Assessment moderation"**
   - https://www.nsw.gov.au/education-and-training/nesa/hsc/exams-and-marking/assessment-moderation
   - The official explanation of the quadratic moderation process with worked examples.

10. **UAC, "Preliminary Report on the Scaling of the 2025 NSW HSC"**
    - https://www.uac.edu.au/assets/documents/scaling-reports/preliminary-report-on-the-scaling-of-the-hsc.pdf
    - Documents the 2025 reform removing Category A/B distinction.

### Key Data Tables in the 2024 Scaling Report

| Table | Content | Pages |
|---|---|---|
| A1 | Course enrolments, gender, ATAR eligibility, max ATAR by course | 34–37 |
| A2 | Distributions of 2024 HSC marks by course | 38–40 |
| A3 | Descriptive statistics and selected percentiles for HSC and scaled marks | 41–46 |
| A4 | Distributions of HSC marks: 2023 vs 2024 | 47–51 |
| A5 | Distributions of scaled marks: 2023 vs 2024 | 52–56 |
| A6 | Courses that contribute to the ATAR (>10 units) | 57–59 |
| A7 | ATAR distribution | 60–61 |
| A8 | ATAR percentiles: 2020–2024 | 62 |
| A9 | Relationship between ATAR and aggregates: 2020–2024 | 62–63 |

### Governance

The ATAR calculation is the responsibility of the **Technical Committee on Scaling** on behalf of the **NSW Vice-Chancellors' Committee**. The Chair in 2024 was **Assoc Prof Rod Yager** (Macquarie University).

---

*This document contains no information beyond what is published in the official sources listed above. Every numerical claim can be verified against the cited page and table of the 2024 Scaling Report or the relevant NESA/UAC webpage. No external interpretations, third-party analyses, or unofficial "tips" have been included.*