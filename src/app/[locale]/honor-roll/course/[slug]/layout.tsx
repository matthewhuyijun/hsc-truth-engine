import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { JsonLd } from "@/components/JsonLd";

interface CourseData {
  code: string;
  name: string;
}

async function getCourseName(code: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "courses.json");
    const data = JSON.parse(await readFile(filePath, "utf8")) as CourseData[];
    const found = data.find((c) => c.code === code);
    return found?.name || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const courseName = await getCourseName(slug);
  const title = courseName
    ? `${courseName} — HSC Honor Roll`
    : "Course Details — HSC Honor Roll";
  const description = courseName
    ? `View Band 6, state rank, and school performance data for ${courseName} (${slug}) across all NSW schools from 2001–2025.`
    : "View Band 6 achievement data for a specific HSC course, including state rank distributions and school breakdowns.";

  return {
    title,
    description,
    alternates: {
      canonical: `/honor-roll/course/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://hscdata.org/honor-roll/course/${slug}`,
    },
  };
}

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "HSC Data",
              item: "https://hscdata.org",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Honor Roll",
              item: "https://hscdata.org/honor-roll",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Course Details",
              item: "https://hscdata.org/honor-roll/course",
            },
          ],
        }}
      />
      {children}
    </>
  );
}
