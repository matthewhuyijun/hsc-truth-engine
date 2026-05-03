import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("scalingGraphsTitle"),
    description: t("scalingGraphsDescription"),
    alternates: { canonical: "/scaling-graphs" },
    openGraph: {
      title: t("scalingGraphsOgTitle"),
      description: t("scalingGraphsOgDescription"),
      url: "https://hscdata.org/scaling-graphs",
    },
  };
}

export default function ScalingGraphsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
