"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

function code() { return crypto.randomUUID().replaceAll("-", ""); }

export default function CreatePublicBop() {
  const router = useRouter();
  const upload = useMutation(api.groups.generatePublicUploadUrl);
  const create = useMutation(api.groups.createPublicBop);
  const [sessionId, setSessionId] = useState("");
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [vibe, setVibe] = useState("sunny, soft, a little weird");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSessionId(window.localStorage.getItem("boppi-public-session") || (() => { const value = crypto.randomUUID(); window.localStorage.setItem("boppi-public-session", value); return value; })()); }, []);
  function choose(event: ChangeEvent<HTMLInputElement>) { const next = event.target.files?.[0]; if (!next) return; if (!next.type.startsWith("image/")) return setNotice("That needs to be a photo."); setFile(next); setPreview(URL.createObjectURL(next)); }
  async function submit() {
    if (!sessionId || !name.trim() || !caption.trim()) return setNotice("Add your name and one little feeling first.");
    setSaving(true); setNotice("");
    try {
      let photoId;
      if (file) { const url = await upload({ sessionId }); const response = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file }); if (!response.ok) throw new Error("The photo got lost on the way up."); photoId = (await response.json()).storageId; }
      const result = await create({ sessionId, creatorName: name, caption, vibe, shareCode: code(), photoId });
      router.push(`/p/${result.shareCode}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Your bop got shy. Try again."); setSaving(false); }
  }
  return <main className="public-maker"><header><Link href="/" className="logo"><i />boppi</Link><Link href="/spot" className="shared-cta">the public spot ↗</Link></header><section className="maker-card"><p className="kicker">NO ROOM REQUIRED · ONE PERSON · ONE TINY SONG</p><h1>make your own<br /><em>little bop.</em></h1><p className="maker-intro">Give Gemini a photo, a feeling, and a vibe. It will write a tiny Strudel song for you to play and share.</p><label className="maker-photo" style={preview ? { backgroundImage: `url(${preview})` } : undefined}><input type="file" accept="image/*" onChange={choose} /><span>{preview ? "change the little photo" : "add a photo +"}</span></label><div className="maker-form"><label>your name<input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} placeholder="Paul" /></label><label>what happened?<textarea value={caption} maxLength={100} onChange={(event) => setCaption(event.target.value)} placeholder="the sky turned pink on my walk home…" /></label><label>the vibe<input value={vibe} maxLength={40} onChange={(event) => setVibe(event.target.value)} placeholder="warm, playful, late summer" /></label><button className="begin-button" onClick={submit} disabled={saving}>{saving ? "writing your tiny song…" : "make my bop"}<span>↗</span></button></div>{notice && <p className="form-error">{notice}</p>}</section></main>;
}
