"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_RECITER,
  recitationUrl,
  type ReciterId,
} from "@/data/reciters";
import type { SurahView, VerseView } from "@/types/quran";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";

export type AudioController = {
  current: VerseView | null;
  status: AudioStatus;
  error: string | null;
  time: number;
  duration: number;
  repeat: boolean;
  volume: number;
  canNext: boolean;
  canPrev: boolean;
  play: (verse?: VerseView) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  changeVolume: (volume: number) => void;
  toggleRepeat: () => void;
  stop: () => void;
  retry: () => void;
};

const errorMessage = "Audio could not be loaded. Reading continues without it.";

export function useSurahAudio(
  surah: SurahView,
  reciter: ReciterId = DEFAULT_RECITER,
): AudioController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The player keeps a stable identity across reciter changes; the URL is
  // resolved when a verse is played, from the reciter selected at that moment.
  const reciterRef = useRef<ReciterId>(reciter);
  reciterRef.current = reciter;
  const surahNumberRef = useRef(surah.meta.number);
  surahNumberRef.current = surah.meta.number;
  const playlist = useMemo(
    () => (surah.bismillah ? [surah.bismillah, ...surah.verses] : surah.verses),
    [surah],
  );
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  const [current, setCurrent] = useState<VerseView | null>(null);
  const currentRef = useRef<VerseView | null>(null);
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const repeatRef = useRef(false);
  repeatRef.current = repeat;
  const [volume, setVolume] = useState(1);

  const setCurrentVerse = useCallback((verse: VerseView | null) => {
    currentRef.current = verse;
    setCurrent(verse);
  }, []);

  const urlFor = useCallback(
    (verse: VerseView) =>
      recitationUrl(
        reciterRef.current,
        surahNumberRef.current,
        verse.number,
        verse.audio?.url ?? null,
      ),
    [],
  );

  const playVerse = useCallback(
    (verse: VerseView) => {
      const audio = audioRef.current;
      setCurrentVerse(verse);
      setError(null);

      if (!audio) {
        setStatus("error");
        setError("Audio is not ready in this browser yet. Reading continues without it.");
        return;
      }

      const url = urlFor(verse);
      if (!url) {
        setStatus("error");
        setError(verse.audioUnavailableReason ?? "No audio is available for this verse.");
        return;
      }

      const sameSource = audio.src === url;
      if (sameSource) {
        if (!audio.paused) {
          audio.pause();
          return;
        }
        setStatus("loading");
        audio.play().catch((reason: unknown) => {
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          setStatus("error");
          setError(errorMessage);
        });
        return;
      }

      setStatus("loading");
      setTime(0);
      setDuration(0);
      audio.src = url;
      audio.load();
      const attempt = audio.play();
      if (attempt) {
        attempt.catch((reason: unknown) => {
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          if (reason instanceof DOMException && reason.name === "NotAllowedError") {
            setStatus("paused");
            setError("Playback needs a tap on the play button.");
            return;
          }
          setStatus("error");
          setError(errorMessage);
        });
      }
    },
    [setCurrentVerse, urlFor],
  );

  // Switching reciter mid-verse would otherwise leave the old file playing
  // under the new name, so playback stops and the bar waits for a new press.
  const previousReciter = useRef(reciter);
  useEffect(() => {
    if (previousReciter.current === reciter) return;
    previousReciter.current = reciter;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrentVerse(null);
    setStatus("idle");
    setError(null);
    setTime(0);
    setDuration(0);
  }, [reciter, setCurrentVerse]);

  const play = useCallback(
    (verse?: VerseView) => {
      if (verse) {
        playVerse(verse);
        return;
      }
      const active = currentRef.current;
      if (!active) {
        const first = playlistRef.current.find((candidate) => candidate.audio);
        if (first) playVerse(first);
        return;
      }
      playVerse(active);
    },
    [playVerse],
  );

  const next = useCallback(() => {
    const list = playlistRef.current;
    const active = currentRef.current;
    const start = active ? list.findIndex((candidate) => candidate.key === active.key) : -1;
    for (let i = start + 1; i < list.length; i++) {
      if (list[i].audio) {
        playVerse(list[i]);
        return;
      }
    }
    const audio = audioRef.current;
    if (audio) audio.pause();
    setStatus("paused");
  }, [playVerse]);

  const previous = useCallback(() => {
    const list = playlistRef.current;
    const active = currentRef.current;
    const start = active ? list.findIndex((candidate) => candidate.key === active.key) : list.length;
    for (let i = start - 1; i >= 0; i--) {
      if (list[i].audio) {
        playVerse(list[i]);
        return;
      }
    }
  }, [playVerse]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrentVerse(null);
    setStatus("idle");
    setError(null);
    setTime(0);
    setDuration(0);
  }, [setCurrentVerse]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 1;
    audioRef.current = audio;

    const onPlaying = () => {
      setStatus("playing");
      setError(null);
    };
    const onPause = () => {
      setStatus((value) => (value === "loading" ? value : "paused"));
    };
    const onTime = () => setTime(audio.currentTime || 0);
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      setTime(0);
      if (repeatRef.current) {
        audio.currentTime = 0;
        void audio.play().catch(() => {
          setStatus("paused");
        });
        return;
      }
      const list = playlistRef.current;
      const active = currentRef.current;
      const index = active ? list.findIndex((candidate) => candidate.key === active.key) : -1;
      const following = list.slice(index + 1).find((candidate) => candidate.audio);
      if (following) {
        playVerse(following);
      } else {
        setStatus("paused");
      }
    };
    const onError = () => {
      setStatus("error");
      setError(errorMessage);
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [playVerse]);

  const seek = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setTime(value);
  }, []);

  const changeVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, value));
    if (audio) audio.volume = clamped;
    setVolume(clamped);
  }, []);

  const toggleRepeat = useCallback(() => setRepeat((value) => !value), []);

  const retry = useCallback(() => {
    const active = currentRef.current;
    if (active) playVerse(active);
  }, [playVerse]);

  const playlistIndex = current
    ? playlist.findIndex((candidate) => candidate.key === current.key)
    : -1;
  const canNext = playlist.some(
    (candidate, index) => index > playlistIndex && candidate.audio !== null,
  );
  const canPrev = playlist.some(
    (candidate, index) => index < playlistIndex && candidate.audio !== null,
  );

  return {
    current,
    status,
    error,
    time,
    duration,
    repeat,
    volume,
    canNext,
    canPrev,
    play,
    toggle: () => play(),
    next,
    previous,
    seek,
    changeVolume,
    toggleRepeat,
    stop,
    retry,
  };
}
