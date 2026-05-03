import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honor Roll — Course Details",
  description:
    "View Band 6 achievement data for a specific HSC course, including state rank distributions and school breakdowns.",
  alternates: {
    canonical: "/honor-roll/course",
  },
};

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
