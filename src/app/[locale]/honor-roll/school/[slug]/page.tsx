import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import SchoolDetailPage from "./school-detail-content";
import type { SchoolDetailData } from "./school-detail-content";

interface SchoolMeta {
  name: string;
  band6Count: number;
}

export async function generateStaticParams() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "schools-2025.json"
    );
    const data = JSON.parse(
      await readFile(filePath, "utf8")
    ) as SchoolMeta[];
    const top = data
      .sort((a, b) => b.band6Count - a.band6Count)
      .slice(0, 100);
    return top.map((s) => ({
      slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  } catch {
    return [];
  }
}

async function getSchoolDetail(slug: string): Promise<SchoolDetailData | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "school-detail-2025.json"
    );
    const data = JSON.parse(await readFile(filePath, "utf8")) as Record<
      string,
      SchoolDetailData
    >;
    return data[slug] || null;
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
  const initialData = await getSchoolDetail(slug);

  if (!initialData) {
    notFound();
  }

  return <SchoolDetailPage slug={slug} initialData={initialData} />;
}
