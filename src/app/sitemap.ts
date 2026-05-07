import type { MetadataRoute } from "next";
import { readFile } from "fs/promises";
import path from "path";

interface CourseData {
  code: string;
  name: string;
  years: { year: number; band6Count: number }[];
}

interface SchoolDetail {
  name: string;
  stats: { band6Count: number };
}

async function getSchoolSlugs(): Promise<string[]> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "school-detail-2025.json"
    );
    const data = JSON.parse(await readFile(filePath, "utf8")) as Record<
      string,
      SchoolDetail
    >;
    return Object.keys(data);
  } catch {
    return [];
  }
}

async function getCourseCodes(): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "courses.json");
    const data = JSON.parse(await readFile(filePath, "utf8")) as CourseData[];
    return data.map((c) => c.code);
  } catch {
    return [];
  }
}

const BASE_URL = "https://hscdata.org";
const ZH_BASE = `${BASE_URL}/zh`;
const ZHHANT_BASE = `${BASE_URL}/zh-Hant`;

function hreflang(
  enPath: string,
  zhPath: string
): { languages: Record<string, string> } {
  return {
    languages: {
      en: `${BASE_URL}${enPath}`,
      zh: `${ZH_BASE}${zhPath}`,
      "zh-Hant": `${ZHHANT_BASE}${zhPath}`,
    },
  };
}

function entry(
  path: string,
  opts: {
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {}
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: "2025-05-07",
    changeFrequency: opts.changeFrequency ?? "monthly",
    priority: opts.priority ?? 0.5,
    alternates: hreflang(path, path),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    { path: "", priority: 1, cf: "weekly" as const },
    { path: "/insights", priority: 0.9, cf: "monthly" as const },
    { path: "/calculator", priority: 0.9, cf: "monthly" as const },
    { path: "/scaling-graphs", priority: 0.8, cf: "monthly" as const },
    { path: "/honor-roll", priority: 0.8, cf: "weekly" as const },
    { path: "/changelog", priority: 0.5, cf: "monthly" as const },
    { path: "/honor-roll/school", priority: 0.7, cf: "weekly" as const },
    { path: "/honor-roll/course", priority: 0.7, cf: "weekly" as const },
  ];

  const staticPages = staticPaths.map(({ path: p, priority, cf }) =>
    entry(p, { changeFrequency: cf, priority })
  );

  const schoolSlugs = await getSchoolSlugs();
  const schoolPages = schoolSlugs.map((slug) => {
    const p = `/honor-roll/school/${slug}`;
    return entry(p, { priority: 0.6 });
  });

  const courseCodes = await getCourseCodes();
  const coursePages = courseCodes.map((code) => {
    const p = `/honor-roll/course/${code}`;
    return entry(p, { priority: 0.6 });
  });

  return [...staticPages, ...schoolPages, ...coursePages];
}
