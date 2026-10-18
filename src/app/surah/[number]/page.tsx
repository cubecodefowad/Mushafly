import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reader } from "@/components/reader/Reader";
import { allSurahMeta, loadSurah } from "@/data/quran-source";

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
  if (!meta) return { title: "Surah not found" };
  return {
    title: `${meta.name} — Surah ${meta.number}`,
    description: `Read Surah ${meta.name} (${meta.arabicName}) — ${meta.verseCount} verses in Arabic with the Itani English translation.`,
  };
}

export default async function SurahPage({ params }: PageProps) {
  const { number } = await params;
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 114) notFound();
  const surah = loadSurah(parsed);
  return <Reader surah={surah} />;
}
