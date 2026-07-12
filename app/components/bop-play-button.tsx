"use client";

import { useEffect, useRef, useState } from "react";
import { fallbackStrudel, getStrudel } from "../lib/strudel";

type Layer = { role: "bass" | "atmosphere" | "percussion" | "melody"; strudelCode?: string | null };

export default function BopPlayButton({ moments, code, className = "" }: { moments: Layer[]; code?: string | null; className?: string }) {
  const timer = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { void getStrudel(); return () => { getStrudel().then((strudel) => strudel.hush()).catch(() => undefined); }; }, []);

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    getStrudel().then((strudel) => strudel.hush()).catch(() => undefined);
    setPlaying(false);
  };

  const play = async () => {
    stop();
    try {
      const strudel = await getStrudel();
      await strudel.evaluate(code || moments.find((moment) => moment.strudelCode)?.strudelCode || fallbackStrudel);
      setPlaying(true);
      timer.current = window.setTimeout(stop, 18_200);
    } catch { setPlaying(false); }
  };

  return <button className={`bop-play-button ${className}`} onClick={playing ? stop : play}><span>{playing ? "Ⅱ" : "▶"}</span>{playing ? "pause bop" : "play bop"}</button>;
}
