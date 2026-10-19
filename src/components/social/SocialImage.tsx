import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_WIDTH } from "@/lib/site";

export const SOCIAL_IMAGE_SIZE = {
  width: SOCIAL_IMAGE_WIDTH,
  height: SOCIAL_IMAGE_HEIGHT,
};

const INK = "#20241f";
const MUTED = "#5f665b";
const PAPER = "#faf8f3";
const LINE = "#ddd8ca";
const ACCENT = "#2f5d45";

function markDataUrl(): string {
  const file = path.join(process.cwd(), "public", "brand", "mark-dark.png");
  return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
}

/**
 * The share card. It is generated at build time from the same copy and mark as
 * the site, so a link preview cannot drift from the product.
 */
export function SocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "66px 78px",
          border: `18px solid ${ACCENT}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markDataUrl()} width={58} height={58} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 25,
              letterSpacing: 7,
              color: MUTED,
            }}
          >
            MUSHAFLY
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              lineHeight: 1.04,
              letterSpacing: -2,
              maxWidth: 930,
            }}
          >
            A quiet place to read the Quran.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.45,
              color: MUTED,
              maxWidth: 900,
            }}
          >
            All 114 surahs in Arabic, with English and Indonesian translations,
            an Arabic commentary, source-derived Tajweed and recitation.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 22,
            fontSize: 22,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex" }}>mushafly.com</div>
          <div style={{ display: "flex" }}>114 surahs · 6,236 verses</div>
        </div>
      </div>
    ),
    SOCIAL_IMAGE_SIZE,
  );
}
