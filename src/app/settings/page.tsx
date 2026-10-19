import { SettingsClient } from "@/components/settings/SettingsClient";
import { sourceInfo } from "@/data/attribution";
import lock from "@/data/source-lock.json";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Settings",
  description:
    "Reading preferences, local data controls, Tajweed limitations, and source attribution.",
  path: "/settings/",
  noIndex: true,
});

export default function SettingsPage() {
  return (
    <SettingsClient
      source={sourceInfo}
      integrity={{
        repository: lock.repository,
        commit: lock.commit,
        license: lock.license,
        counts: {
          surahs: lock.counts.surahs,
          verses: lock.counts.verses,
          tajweedSegments: lock.counts.tajweedSegments,
        },
        issues: {
          outOfBounds: lock.knownIssues.tajweedOutOfBounds.length,
          overlapping: lock.knownIssues.tajweedOverlapping.length,
          bom: lock.knownIssues.bomStrings.length,
        },
        translationRows: lock.counts.translationRows,
      }}
    />
  );
}
