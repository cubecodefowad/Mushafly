"use client";

import {
  AlertCircle,
  Loader2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { AudioController } from "@/components/audio/useSurahAudio";
import type { SurahView } from "@/types/quran";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

type Props = {
  audio: AudioController;
  surah: SurahView;
};

export function AudioBar({ audio, surah }: Props) {
  if (!audio.current && !audio.error) return null;

  const playing = audio.status === "playing";
  const label = audio.current
    ? audio.current.number === 0
      ? "Bismillah"
      : `Verse ${audio.current.number}`
    : "Audio";
  const announcement = audio.error
    ? audio.error
    : audio.status === "playing"
      ? `Playing ${label}`
      : audio.status === "loading"
        ? `Loading ${label}`
        : audio.status === "paused"
          ? `Paused at ${label}`
          : "";

  return (
    <div className="audio-bar fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-5">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface/95 shadow-[0_16px_50px_rgb(var(--shadow-color)/0.18)] backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <button
            type="button"
            className="icon-button shrink-0"
            onClick={() => audio.previous()}
            aria-label="Previous verse"
            disabled={!audio.canPrev}
          >
            <SkipBack size={17} strokeWidth={1.8} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-paper transition-colors hover:bg-accent-strong disabled:opacity-50"
            onClick={() => audio.toggle()}
            aria-label={playing ? "Pause recitation" : "Play recitation"}
          >
            {audio.status === "loading" ? (
              <Loader2 size={18} className="animate-spin" aria-hidden />
            ) : playing ? (
              <Pause size={17} fill="currentColor" aria-hidden />
            ) : (
              <Play size={17} fill="currentColor" className="ml-0.5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="icon-button shrink-0"
            onClick={() => audio.next()}
            aria-label="Next verse"
            disabled={!audio.canNext}
          >
            <SkipForward size={17} strokeWidth={1.8} aria-hidden />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-xs font-medium text-ink">
                {surah.meta.name}
                <span className="text-muted"> · {label}</span>
              </p>
              <p className="shrink-0 text-[0.625rem] tabular-nums text-muted">
                {formatTime(audio.time)} / {formatTime(audio.duration)}
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={audio.duration || 0}
              step={0.25}
              value={Math.min(audio.time, audio.duration || 0)}
              onChange={(event) => audio.seek(Number(event.target.value))}
              aria-label="Playback position"
              disabled={!audio.duration}
              className="mt-1.5 h-1.5 w-full cursor-pointer disabled:cursor-default disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            className="icon-button hidden shrink-0 sm:inline-flex"
            onClick={() => audio.toggleRepeat()}
            aria-label="Repeat current verse"
            aria-pressed={audio.repeat}
          >
            <Repeat size={16} strokeWidth={1.8} aria-hidden />
          </button>

          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <button
              type="button"
              className="icon-button"
              onClick={() => audio.changeVolume(audio.volume > 0 ? 0 : 1)}
              aria-label={audio.volume > 0 ? "Mute recitation" : "Unmute recitation"}
            >
              {audio.volume > 0 ? (
                <Volume2 size={16} strokeWidth={1.8} aria-hidden />
              ) : (
                <VolumeX size={16} strokeWidth={1.8} aria-hidden />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.volume}
              onChange={(event) => audio.changeVolume(Number(event.target.value))}
              aria-label="Volume"
              className="w-16"
            />
          </div>

          <button
            type="button"
            className="icon-button shrink-0"
            onClick={() => audio.stop()}
            aria-label="Close audio player"
          >
            <X size={16} strokeWidth={1.8} aria-hidden />
          </button>
        </div>

        {audio.error ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2 text-[0.6875rem] text-muted">
            <AlertCircle size={13} strokeWidth={1.8} className="text-accent" aria-hidden />
            <span className="flex-1">{audio.error}</span>
            {audio.current?.audio ? (
              <button
                type="button"
                onClick={() => audio.retry()}
                className="underline decoration-line underline-offset-2 hover:text-ink"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
