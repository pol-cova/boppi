"use client";

import { useEffect, useRef, useState } from "react";

type Layer = { role: "bass" | "atmosphere" | "percussion" | "melody"; soundUrl?: string | null };

export default function BopPlayButton({ moments, className = "" }: { moments: Layer[]; className?: string }) {
  const context = useRef<AudioContext | null>(null);
  const clips = useRef<HTMLAudioElement[]>([]);
  const timer = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    clips.current.forEach((clip) => { clip.pause(); clip.src = ""; }); clips.current = [];
    if (context.current) { context.current.close(); context.current = null; }
    setPlaying(false);
  };

  useEffect(() => stop, []);

  const play = () => {
    stop();
    const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const ctx = new Context(); context.current = ctx;
    const master = ctx.createGain(); master.gain.value = .15; master.connect(ctx.destination);
    const now = ctx.currentTime + .04;
    const has = (role: Layer["role"]) => moments.some((moment) => moment.role === role);
    const tone = (at: number, note: number, length: number, kind: OscillatorType, volume: number) => { const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); oscillator.type = kind; oscillator.frequency.value = note; gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .015); gain.gain.exponentialRampToValueAtTime(.0001, at + length); oscillator.connect(gain).connect(master); oscillator.start(at); oscillator.stop(at + length + .03); };
    for (let beat = 0; beat < 72; beat += 1) { const at = now + beat * .25; if (has("bass") && beat % 4 === 0) tone(at, beat % 8 === 0 ? 98 : 110, .23, "sine", .65); if (has("percussion") && beat % 2 === 0) tone(at, 120 + (beat % 3) * 40, .045, "square", .19); if (has("melody") && beat % 4 === 2) tone(at, [392, 440, 494, 523][beat % 4], .19, "triangle", .22); }
    if (has("atmosphere")) tone(now, 196, 17.8, "sine", .07);
    clips.current = moments.flatMap((moment) => { if (!moment.soundUrl) return []; const clip = new Audio(moment.soundUrl); clip.volume = .17; void clip.play().catch(() => undefined); return [clip]; });
    setPlaying(true); timer.current = window.setTimeout(stop, 18_200);
  };

  return <button className={`bop-play-button ${className}`} onClick={playing ? stop : play}><span>{playing ? "Ⅱ" : "▶"}</span>{playing ? "pause bop" : "play bop"}</button>;
}
