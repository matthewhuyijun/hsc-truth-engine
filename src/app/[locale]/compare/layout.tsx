import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://hscdata.org"),
  title: "Compare Schools — HSC Data",
  description:
    "Compare school performance across Band 6/E4 counts, state ranks, and SPaRO school averages over time (2001–2025).",
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    title: "Compare Schools — HSC Data",
    description:
      "Compare school performance across Band 6/E4 counts, state ranks, and SPaRO school averages over time.",
    url: "https://hscdata.org/compare",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
