"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import BopPlayButton from "../components/bop-play-button";

type PublicBop = { _id: string; creatorName: string; vibe: string; title: string; caption: string; strudelCode: string; imageUrl: string | null };

export default function PublicSpot() {
  const bops = useQuery(api.groups.listPublicBops);
  return <main className="spot-page"><header><Link href="/" className="logo"><i />boppi</Link><Link href="/create" className="spot-create">make your own bop ↗</Link></header><section className="spot-hero"><p className="kicker">THE PUBLIC SPOT · LITTLE SONGS FROM STRANGERS</p><h1>leave a little<br /><em>sound here.</em></h1><p>Every bop is a tiny postcard from someone&apos;s day.</p></section><section className="spot-grid">{bops === undefined ? <p className="spot-empty">tuning the little radio…</p> : bops.length ? bops.map((bop: PublicBop) => <article className="spot-card" key={bop._id}>{bop.imageUrl ? <img src={bop.imageUrl} alt="" /> : <div className="spot-art">♫</div>}<div><small>{bop.creatorName} · {bop.vibe}</small><h2>{bop.title}</h2><p>“{bop.caption}”</p><BopPlayButton moments={[]} code={bop.strudelCode} /></div></article>) : <p className="spot-empty">The spot is quiet. Be the first little sound.</p>}</section></main>;
}
