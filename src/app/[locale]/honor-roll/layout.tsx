import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honor Roll",
  description:
    "Browse Band 6 and Distinguished Achiever results across NSW schools and courses. Filter by year (2001–2025) and subject. Free, searchable HSC data.",
  alternates: {
    canonical: "/honor-roll",
  },
  openGraph: {
    title: "HSC Honor Roll — Band 6 Results by School & Course",
    description:
      "Browse Band 6 and Distinguished Achiever results across NSW schools. Searchable data from 2001 to 2025.",
    url: "https://hscdata.org/honor-roll",
  },
};

export default function HonorRollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
