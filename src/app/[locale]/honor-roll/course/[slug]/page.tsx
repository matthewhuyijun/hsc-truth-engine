import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import CourseDetailPage from "./course-detail-content";

interface CourseMeta {
  code: string;
  name: string;
  allNames?: string[];
  years: { year: number; band6Count: number }[];
}

interface CourseStats {
  name: string;
  total: number;
  male: number;
  female: number;
  non_binary: number;
  bands?: Record<string, number>;
}

export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "courses.json");
    const data = JSON.parse(await readFile(filePath, "utf8")) as CourseMeta[];
    return data.map((c) => ({ slug: c.code }));
  } catch {
    return [];
  }
}

async function getCourseData(code: string): Promise<CourseMeta | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "courses.json");
    const data = JSON.parse(await readFile(filePath, "utf8")) as CourseMeta[];
    return data.find((c) => c.code === code) || null;
  } catch {
    return null;
  }
}

async function getCourseStats(
  code: string
): Promise<CourseStats | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "course-stats-2025.json"
    );
    const data = JSON.parse(
      await readFile(filePath, "utf8")
    ) as Record<string, CourseStats>;
    return data[code] || null;
  } catch {
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const courseData = await getCourseData(slug);

  if (!courseData) {
    notFound();
  }

  const courseStats = await getCourseStats(slug);

  return (
    <CourseDetailPage
      slug={slug}
      initialCourseData={courseData}
      initialCourseStats={courseStats}
    />
  );
}
