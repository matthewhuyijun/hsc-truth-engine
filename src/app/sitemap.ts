import type { MetadataRoute } from "next";
import fs from "fs";
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

function getSchoolSlugs(): string[] {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "school-detail-2025.json"
    );
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
      string,
      SchoolDetail
    >;
    return Object.keys(data);
  } catch {
    return [];
  }
}

function getCourseCodes(): string[] {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "courses.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as CourseData[];
    return data.map((c) => c.code);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hscdata.org";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/scaling-graphs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/honor-roll`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/honor-roll/school`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/honor-roll/course`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const schoolSlugs = getSchoolSlugs();
  const schoolPages: MetadataRoute.Sitemap = schoolSlugs.map((slug) => ({
    url: `${baseUrl}/honor-roll/school/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const courseCodes = getCourseCodes();
  const coursePages: MetadataRoute.Sitemap = courseCodes.map((code) => ({
    url: `${baseUrl}/honor-roll/course/${code}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...schoolPages, ...coursePages];
}
