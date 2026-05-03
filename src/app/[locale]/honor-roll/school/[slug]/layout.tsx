import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { JsonLd } from "@/components/JsonLd";

interface SchoolDetail {
  name: string;
  stats: { band6Count: number; uniqueStudents: number; stateRanks: number };
}

async function getSchoolName(slug: string): Promise<string | null> {
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
    const found = data[slug];
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
  const schoolName = await getSchoolName(slug);
  const title = schoolName
    ? `${schoolName} — HSC Honor Roll`
    : "School Details — HSC Honor Roll";
  const description = schoolName
    ? `View Band 6 achievement data for ${schoolName}, including subject performance, student results, and year-by-year trends from 2001–2025.`
    : "View Band 6 achievement data for a specific NSW school, including course breakdowns and state rank counts.";

  return {
    title,
    description,
    alternates: {
      canonical: `/honor-roll/school/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://hscdata.org/honor-roll/school/${slug}`,
    },
  };
}

export default function SchoolDetailLayout({
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
              name: "School Details",
              item: "https://hscdata.org/honor-roll/school",
            },
          ],
        }}
      />
      {children}
    </>
  );
}
