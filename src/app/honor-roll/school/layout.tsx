import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honor Roll — School Details",
  description:
    "View Band 6 achievement data for a specific NSW school, including course breakdowns and state rank counts.",
  alternates: {
    canonical: "/honor-roll/school",
  },
};

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
