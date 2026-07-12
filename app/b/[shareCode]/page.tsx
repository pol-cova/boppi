"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import BopPlayButton from "../../components/bop-play-button";

export default function SharedBop() {
  const params = useParams<{ shareCode: string }>();
  const bop = useQuery(api.groups.getSharedBop, { shareCode: params.shareCode });
  if (bop === undefined) return <main className="loading-screen"><div className="loading-orb" /><p>finding the tiny song…</p></main>;
  if (!bop || !bop.group) return <main className="missing"><Link href="/" className="logo"><i />boppi</Link><h1>This little bop<br />wandered <em>off.</em></h1><Link href="/create" className="begin-button">make one from a feeling ↗</Link></main>;
  return <main className="shared-shell"><header><Link href="/" className="logo"><i />boppi</Link><Link href="/create" className="shared-cta">make a bop ↗</Link></header><section className="shared-hero"><p className="kicker">A TINY SONG FROM {bop.group.name.toUpperCase()}</p><h1>{bop.song.title}</h1><p className="shared-date">made from {bop.moments.length} little moments · {new Date(`${bop.song.day}T12:00:00`).toLocaleDateString("en", { month: "long", day: "numeric" })}</p><BopPlayButton moments={bop.moments} code={bop.song.strudelCode} className="share-play" /><div className="shared-collage">{bop.moments.map((moment: any, index: number) => <figure className={`share-photo share-${index}`} key={moment._id}>{moment.imageUrl && <img src={moment.imageUrl} alt="" />}<figcaption>{moment.creatorName}<br /><span>{moment.role}</span></figcaption></figure>)}<div className="share-disc"><span>♫</span><small>little<br />bop</small></div></div></section><section className="shared-layers"><p className="kicker">HOW IT GOT HERE</p>{bop.moments.map((moment: any, index: number) => <article key={moment._id}><span>0{index + 1}</span><p><b>{moment.creatorName}&apos;s</b> “{moment.caption}”<br /><em>{moment.interpretation || `became the ${moment.role}.`}</em></p><i>✦</i></article>)}</section><footer><span>little moments. one tiny song.</span><Link href="/create">make one from your own feeling ↗</Link></footer></main>;
}
