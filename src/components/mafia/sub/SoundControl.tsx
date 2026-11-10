"use client";

import { useEffect, useRef, useState } from "react";
import type { Phase } from "../types";

type Cue = Exclude<Phase, "setup"> | "elimination";

export function SoundControl({ phase, lastEvent }: { phase: Phase; lastEvent: string }) {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previous = useRef({ phase, lastEvent });

  useEffect(() => {
    const before = previous.current;
    previous.current = { phase, lastEvent };
    if (!enabled || document.hidden) return;

    let cue: Cue | null = null;
    if (phase !== before.phase && phase !== "setup") cue = phase;
    if (phase !== "ended" && lastEvent === "elimination" && before.lastEvent !== lastEvent) {
      cue = "elimination";
    }
    const audio = audioRef.current;
    if (cue && audio) {
      audio.src = `/sounds/${cue}.wav`;
      audio.volume = 0.35;
      // Autoplay restrictions or unavailable audio must never interrupt a game.
      void audio.play().catch(() => {});
    }
  }, [phase, lastEvent, enabled]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  function toggleSound() {
    if (enabled) {
      audioRef.current?.pause();
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = "/sounds/day.wav";
      audio.volume = 0.35;
      // Start in the click handler to respect browser user-gesture policies.
      void audio.play().catch(() => {});
    }
    setEnabled((value) => !value);
  }

  return (
    <div className="flex justify-end">
      <audio ref={audioRef} preload="none" aria-hidden="true" />
      <button
        aria-pressed={enabled}
        className="relative z-20 min-h-11 border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        onClick={toggleSound}
        type="button"
      >
        효과음 {enabled ? "켜짐" : "꺼짐"}
      </button>
    </div>
  );
}
