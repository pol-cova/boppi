"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import BopPlayButton from "../../components/bop-play-button";

export default function PublicBop() {
  const params = useParams<{ shareCode: string }>();
  const bop = useQuery(api.groups.getPublicBop, { shareCode: params.shareCode });
  if (bop === undefined) return <main className="loading-screen"><div className="loading-orb" /><p>finding your tiny song…</p></main>;
  if (!bop) return <main className="missing"><Link href="/" className="logo"><i />boppi</Link><h1>This bop<br />wandered <em>off.</em></h1><Link href="/create" className="begin-button">make another one ↗</Link></main>;
  return <main className="public-bop-page"><header><Link href="/" className="logo"><i />boppi</Link><Link href="/create" className="shared-cta">make your own ↗</Link></header><section className="public-bop-hero"><p className="kicker">A LITTLE BOP BY {bop.creatorName.toUpperCase()}</p><div className="public-art">{bop.imageUrl && <img src={bop.imageUrl} alt="" />}<span>♫</span></div><h1>{bop.title}</h1><p>“{bop.caption}”</p><small>{bop.vibe}</small><BopPlayButton moments={[]} code={bop.strudelCode} className="share-play" /></section><footer><Link href="/spot">visit the public spot ↗</Link><Link href="/create">make one from your own feeling ↗</Link></footer></main>;
}
