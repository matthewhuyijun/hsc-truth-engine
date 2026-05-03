import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scaling Graphs",
  description:
    "Visualise HSC scaling curves for every NSW course. Compare up to 8 subjects side by side. Understand exactly how raw marks translate to scaled marks.",
  alternates: {
    canonical: "/scaling-graphs",
  },
  openGraph: {
    title: "HSC Scaling Graphs — Visualise Subject Scaling Curves",
    description:
      "Interactive scaling graphs for every NSW HSC course. Compare subjects, see percentile curves, and understand how scaling works.",
    url: "https://hscdata.org/scaling-graphs",
  },
};

export default function ScalingGraphsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
