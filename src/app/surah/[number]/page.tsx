import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reader } from "@/components/reader/Reader";
import { allSurahMeta, loadSurah } from "@/data/quran-source";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSurahMeta.map((surah) => ({ number: String(surah.number) }));
}

type PageProps = {
  params: Promise<{ number: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { number } = await params;
  const meta = allSurahMeta[Number(number) - 1];
  if (!meta) return { title: "Surah not found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${meta.name} — Surah ${meta.number}`,
    description: `Read Surah ${meta.name} (${meta.arabicName}) — ${meta.verseCount} verses in Arabic with 68 translations across 29 languages and an Arabic commentary.`,
    path: `/surah/${meta.number}/`,
  });
}

export default async function SurahPage({ params }: PageProps) {
  const { number } = await params;
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 114) notFound();
  const surah = loadSurah(parsed);
  return <Reader surah={surah} />;
}
