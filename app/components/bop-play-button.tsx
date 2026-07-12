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
    const ctx = new Context(); context.current = ctx; void ctx.resume();
    const master = ctx.createGain(); master.gain.value = .42;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 5; compressor.attack.value = .004; compressor.release.value = .18;
    master.connect(compressor).connect(ctx.destination);
    const now = ctx.currentTime + .04;
    const has = (role: Layer["role"]) => moments.some((moment) => moment.role === role);
    const tone = (at: number, note: number, length: number, kind: OscillatorType, volume: number) => { const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); oscillator.type = kind; oscillator.frequency.value = note; gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .018); gain.gain.exponentialRampToValueAtTime(.0001, at + length); oscillator.connect(gain).connect(master); oscillator.start(at); oscillator.stop(at + length + .03); };
    const tune = [523, 659, 784, 659, 587, 659, 523, 440];
    const bassline = [131, 131, 147, 165, 131, 147, 110, 131];
    for (let beat = 0; beat < 72; beat += 1) { const at = now + beat * .25; const phrase = Math.floor(beat / 2) % tune.length; if (beat % 2 === 0) tone(at, tune[phrase], .34, "triangle", has("melody") ? .48 : .34); if (beat % 4 === 0) tone(at, bassline[Math.floor(beat / 4) % bassline.length], .36, "sine", has("bass") ? .5 : .3); if (beat % 4 === 0) tone(at, 62, .09, "sine", has("percussion") ? .42 : .24); if (beat % 2 === 1) tone(at, 1568, .025, "square", has("percussion") ? .13 : .075); }
    for (const note of [262, 330, 392]) tone(now, note, 17.8, "sine", has("atmosphere") ? .055 : .028);
    clips.current = moments.flatMap((moment) => { if (!moment.soundUrl) return []; const clip = new Audio(moment.soundUrl); clip.volume = .28; void clip.play().catch(() => undefined); return [clip]; });
    setPlaying(true); timer.current = window.setTimeout(stop, 18_200);
  };

  return <button className={`bop-play-button ${className}`} onClick={playing ? stop : play}><span>{playing ? "Ⅱ" : "▶"}</span>{playing ? "pause bop" : "play bop"}</button>;
}
