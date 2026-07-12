"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import BopPlayButton from "./components/bop-play-button";

type Role = "bass" | "atmosphere" | "percussion" | "melody";
type Moment = { _id: string; creatorName: string; caption: string; role: Role; color: string; imageUrl: string | null; soundUrl?: string | null; generationStatus?: "pending" | "ready" | "fallback" | "failed"; interpretation?: string };

const roleDetails: Record<Role, { mark: string; line: string }> = {
  bass: { mark: "◒", line: "became the soft, steady bass." },
  atmosphere: { mark: "⌁", line: "became the air around everything." },
  percussion: { mark: "✳", line: "became the rhythm in the room." },
  melody: { mark: "◌", line: "became the little melody on top." },
};

function localDay() {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(new Date()).toLowerCase();
}

function opaqueCode() {
  return crypto.randomUUID().replaceAll("-", "");
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("the good people");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<"today" | "archive">("today");
  const [notice, setNotice] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isMaking, setIsMaking] = useState(false);
  const [revealStep, setRevealStep] = useState<number | null>(null);
  const { isPlaying, play, stop } = useTinySong();

  const home = useQuery(api.groups.getHome, sessionId ? { sessionId } : "skip");
  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);
  const generateUploadUrl = useMutation(api.groups.generateUploadUrl);
  const createMoment = useMutation(api.groups.createMoment);
  const makeBop = useMutation(api.groups.makeBop);

  useEffect(() => {
    const stored = window.localStorage.getItem("boppi-session") || crypto.randomUUID();
    window.localStorage.setItem("boppi-session", stored);
    const code = new URL(window.location.href).searchParams.get("join");
    if (code) { setMode("join"); setInviteCode(code); }
    setSessionId(stored);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const moments = home?.moments ?? [];
  const todaySong = home?.todaySong;
  const todayLabel = useMemo(() => localDay(), []);

  async function setUpRoom() {
    if (!sessionId) return;
    setNotice("");
    try {
      const result = mode === "create"
        ? await createGroup({ name: roomName, displayName, sessionId, inviteCode: opaqueCode() })
        : await joinGroup({ inviteCode: inviteCode.trim(), displayName, sessionId });
      window.localStorage.setItem("boppi-room", result.inviteCode);
      window.history.replaceState({}, "", window.location.pathname);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something tiny went sideways.");
    }
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) { setNotice("That doesn’t look like a photo."); return; }
    if (selected.size > 8 * 1024 * 1024) { setNotice("Keep it under 8MB for this tiny room."); return; }
    setFile(selected); setPreview(URL.createObjectURL(selected)); setNotice("");
  }

  async function postMoment() {
    if (!sessionId || !file || !caption.trim()) { setNotice("Add one photo and a little caption first."); return; }
    setIsPosting(true); setNotice("");
    try {
      const uploadUrl = await generateUploadUrl({ sessionId });
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Your photo got lost on the way up.");
      const { storageId } = await response.json();
      await createMoment({ sessionId, caption, photoId: storageId });
      setCaption(""); setFile(null); setPreview(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn’t add that little thing.");
    } finally { setIsPosting(false); }
  }

  async function createBop() {
    if (!sessionId) return;
    setIsMaking(true); setNotice("");
    try {
      const result = await makeBop({ sessionId, shareCode: opaqueCode() });
      if (result.isNew) {
        setRevealStep(0);
        window.setTimeout(() => setRevealStep(1), 1700);
        window.setTimeout(() => setRevealStep(2), 3400);
        window.setTimeout(() => setRevealStep(3), 5100);
        window.setTimeout(() => { setRevealStep(4); play(moments); }, 6800);
      } else {
        play(moments);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn’t make the bop yet.");
    } finally { setIsMaking(false); }
  }

  async function copyInvite() {
    if (!home) return;
    const link = `${window.location.origin}/?join=${home.group.inviteCode}`;
    await navigator.clipboard?.writeText(link);
    setNotice("Invite copied — send it to a good person.");
  }

  async function shareBop() {
    if (!todaySong) return;
    const url = `${window.location.origin}/b/${todaySong.shareCode}`;
    if (navigator.share) await navigator.share({ title: todaySong.title, text: "We turned little moments into one tiny song.", url });
    else { await navigator.clipboard?.writeText(url); setNotice("Bop link copied."); }
  }

  if (!sessionId || home === undefined) return <Loading />;
  if (!home) return <Onboarding mode={mode} setMode={setMode} roomName={roomName} setRoomName={setRoomName} displayName={displayName} setDisplayName={setDisplayName} inviteCode={inviteCode} setInviteCode={setInviteCode} notice={notice} submit={setUpRoom} />;

  return <main className="boppi-shell">
    <header className="masthead">
      <button className="logo" onClick={() => setTab("today")} aria-label="Boppi home"><i />boppi</button>
      <div className="room-stamp"><span className="pulse-dot" /> {home.group.name} <b>·</b> {todayLabel}</div>
      <button className="member-chip" title={`${home.members.length} people in this room`}><span>{home.me.displayName.slice(0, 1).toUpperCase()}</span>{home.members.length} people</button>
    </header>

    <nav className="room-nav">
      <button className={tab === "today" ? "selected" : ""} onClick={() => setTab("today")}>today&apos;s room <span>{moments.length}/4</span></button>
      <button className={tab === "archive" ? "selected" : ""} onClick={() => setTab("archive")}>small archive</button>
      <button className="invite" onClick={copyInvite}>copy invite <span>↗</span></button>
    </nav>

    {tab === "archive" ? <Archive songs={home.archive} onBack={() => setTab("today")} /> : <>
      <section className="room-hero">
        <div className="floating-photo photo-a" />
        <div className="floating-photo photo-b" />
        <div className="hero-scribble">not a feed.<br />a feeling. <span>↘</span></div>
        <p className="kicker">ONE DAY · UP TO FOUR PEOPLE · ONE TINY SONG</p>
        <h1>How did today<br /><em>feel?</em></h1>
        <p>Leave one thing you loved. It will become a sound<br />in the room&apos;s little song.</p>
        <div className="hero-planet" aria-hidden="true"><div className="planet-face"><i /><i /><b /></div><div className="planet-ring" /><div className="planet-label">{moments.length ? `${moments.length} sounds floating` : "waiting for a feeling"}</div></div>
      </section>

      <section className="main-grid">
        <div className="moments-zone">
          <div className="zone-title"><div><span>01</span><h2>little things from today</h2></div><p>{moments.length === 0 ? "be the first to leave one" : `${4 - moments.length} spot${4 - moments.length === 1 ? "" : "s"} left`}</p></div>
          <div className="moment-grid">
            {moments.map((moment, index) => <MomentCard moment={moment} index={index} me={home.me.displayName} key={moment._id} />)}
            {moments.length < 4 && !moments.some((moment) => moment.creatorName === home.me.displayName) && <Composer caption={caption} setCaption={setCaption} preview={preview} choosePhoto={choosePhoto} postMoment={postMoment} isPosting={isPosting} />}
            {Array.from({ length: Math.max(0, 3 - moments.length - (moments.some((m) => m.creatorName === home.me.displayName) ? 0 : 1)) }).map((_, index) => <div className="empty-card" key={index}><span>✦</span> waiting for a<br />little thing</div>)}
          </div>
        </div>

        <aside className="song-zone">
          <div className="zone-title"><div><span>02</span><h2>today&apos;s bop</h2></div><p>{todaySong ? "made with your room" : "not made yet"}</p></div>
          <div className={`bop-player ${todaySong ? "ready" : ""}`}>
            <div className="player-top"><span>{todaySong ? "MADE IN YOUR ROOM" : "THE LITTLE MIXER"}</span><span>{todaySong ? "00:18" : "00:00"}</span></div>
            <div className="vinyl"><div className="vinyl-rings" /><div className="vinyl-center">b<br />o<br />p</div></div>
            <h3>{todaySong?.title ?? "not a song yet"}</h3>
            <p>{todaySong ? `${moments.length} tiny moments, all together.` : "Two moments unlock the little mixer."}</p>
            <div className="soundline">{Array.from({ length: 29 }).map((_, i) => <i key={i} style={{ height: `${10 + ((i * 31) % 29)}px` }} />)}</div>
            <button className="listen-button" disabled={!todaySong} onClick={() => isPlaying ? stop() : play(moments)}><span>{isPlaying ? "Ⅱ" : "▶"}</span>{isPlaying ? "pause" : "listen"}</button>
          </div>
          {todaySong ? <button className="action-button dark" onClick={shareBop}>share this bop <span>↗</span></button> : <button className="action-button" disabled={moments.length < 2 || isMaking} onClick={createBop}>{isMaking ? <><i className="spinner" /> making sense of the moments</> : <>make today&apos;s bop <span>↗</span></>}</button>}
          <p className="quiet-note">{todaySong ? "This link is public. Your room stays private." : "No AI dashboard. Just a very small bit of magic."}</p>
        </aside>
      </section>
    </>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    {revealStep !== null && <Reveal moments={moments} step={revealStep} close={() => setRevealStep(null)} isPlaying={isPlaying} stop={stop} />}
    <footer><span>© boppi</span><span>made for close friends <b>♥</b></span><span>one little thing a day</span></footer>
  </main>;
}

function Loading() { return <main className="loading-screen"><div className="loading-orb" /><p>opening the little room…</p></main>; }

function Onboarding(props: { mode: "create" | "join"; setMode: (mode: "create" | "join") => void; roomName: string; setRoomName: (value: string) => void; displayName: string; setDisplayName: (value: string) => void; inviteCode: string; setInviteCode: (value: string) => void; notice: string; submit: () => void }) {
  const { mode, setMode, roomName, setRoomName, displayName, setDisplayName, inviteCode, setInviteCode, notice, submit } = props;
  const moods = [{ icon: "☀", name: "sunny", note: "bright little sounds" }, { icon: "☕", name: "cozy", note: "warm + slow" }, { icon: "✳", name: "silly", note: "make it weird" }];
  const [mood, setMood] = useState(0);
  return <main className="onboarding playful-landing"><header><div className="logo"><i />boppi</div><span>little moments. one tiny song.</span><div className="header-wiggle">made for group chats <b>↗</b></div></header><div className="landing-confetti confetti-a">✦</div><div className="landing-confetti confetti-b">♥</div><div className="onboard-collage"><div className="collage-card card-one">☕<span>soft bass</span><i>01</i></div><div className="collage-card card-two">☁<span>air around it</span><i>02</i></div><div className="collage-card card-three">✳<span>tiny beat</span><i>03</i></div><div className="collage-card card-four">♫<span>your tiny bop</span><i>04</i></div><div className="collage-caption">everybody adds<br />one <em>little thing</em></div></div><section className="onboard-box"><p className="kicker">A PRIVATE SONG FOR YOUR FAVORITE PEOPLE</p><h1>one photo.<br /><em>one feeling.</em><br />one bop.</h1><p className="intro">A little room for two to four people. Leave a moment, hear it become part of a song, save the day forever.</p><div className="tiny-steps"><span><b>1</b> leave a thing</span><i>→</i><span><b>2</b> it finds a sound</span><i>→</i><span><b>3</b> press play</span></div><div className="mood-picker"><p>pick a room energy <span>just for fun</span></p><div>{moods.map((item, index) => <button key={item.name} className={mood === index ? "picked" : ""} onClick={() => setMood(index)}><i>{item.icon}</i><b>{item.name}</b><small>{item.note}</small></button>)}</div></div><div className="switcher"><button className={mode === "create" ? "selected" : ""} onClick={() => setMode("create")}>start a room</button><button className={mode === "join" ? "selected" : ""} onClick={() => setMode("join")}>join a room</button></div><div className="onboard-form">{mode === "create" ? <label>your room&apos;s name<input value={roomName} maxLength={32} onChange={(event) => setRoomName(event.target.value)} placeholder="friday club" /></label> : <label>invite code<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="thegood-12345" /></label>}<label>your first name<input value={displayName} maxLength={24} onChange={(event) => setDisplayName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Paul" /></label><button className="begin-button" onClick={submit}>{mode === "create" ? "make a little room" : "enter the room"} <span>↗</span></button></div>{notice && <p className="form-error">{notice}</p>}<p className="fineprint">No passwords, public feeds, or pressure. Just an invite link.</p></section><div className="mood-bubble"><span>{moods[mood].icon}</span><b>{moods[mood].name} room</b><small>{moods[mood].note}</small></div></main>;
}

function MomentCard({ moment, index, me }: { moment: Moment; index: number; me: string }) {
  return <article className={`moment-tile tone-${moment.color}`}><div className="photo-wrap">{moment.imageUrl && <img src={moment.imageUrl} alt={`${moment.creatorName}'s moment`} />}<span className="tile-number">0{index + 1}</span>{moment.creatorName === me && <span className="mine">YOU</span>}</div><div className="tile-body"><div><strong>{moment.creatorName}</strong><span>today</span></div><p>“{moment.caption}”</p><small className={moment.generationStatus === "pending" ? "is-thinking" : ""}><i>{moment.generationStatus === "pending" ? "· · ·" : roleDetails[moment.role].mark}</i>{moment.generationStatus === "pending" ? "finding its sound" : moment.role}</small></div></article>;
}

function Composer({ caption, setCaption, preview, choosePhoto, postMoment, isPosting }: { caption: string; setCaption: (value: string) => void; preview: string | null; choosePhoto: (event: ChangeEvent<HTMLInputElement>) => void; postMoment: () => void; isPosting: boolean }) {
  return <article className="composer-card"><label className={`photo-picker ${preview ? "has-preview" : ""}`} style={preview ? { backgroundImage: `url(${preview})` } : undefined}><input type="file" accept="image/*" onChange={choosePhoto} /><span>{preview ? "change photo" : "add a photo +"}</span></label><div className="composer-copy"><p>your little thing</p><textarea value={caption} maxLength={60} onChange={(event) => setCaption(event.target.value)} placeholder="something you loved…" /><div><span>{caption.length}/60</span><button onClick={postMoment} disabled={isPosting}>{isPosting ? "adding…" : "add it ↗"}</button></div></div></article>;
}

function Archive({ songs, onBack }: { songs: Array<{ _id: string; title: string; day: string; momentIds: string[]; moments: Array<{ role: Role; soundUrl?: string | null }> }>; onBack: () => void }) {
  return <section className="archive"><button className="back-link" onClick={onBack}>← back to today</button><p className="kicker">A RECORD OF THE ORDINARY STUFF</p><h1>small <em>archive.</em></h1><p className="archive-copy">Songs from the days you would otherwise<br />forget were this good.</p><div className="archive-list">{songs.length ? songs.map((song, index) => <article key={song._id}><span>0{index + 1}</span><div className={`archive-art art-${index % 4}`}>♫</div><div><small>{new Date(`${song.day}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })} · {song.momentIds.length} moments</small><h2>{song.title}</h2></div><BopPlayButton moments={song.moments} className="archive-play" /></article>) : <div className="archive-empty">Your first bop will live here. It&apos;ll be nice to meet it again.</div>}</div></section>;
}

function Reveal({ moments, step, close, isPlaying, stop }: { moments: Moment[]; step: number; close: () => void; isPlaying: boolean; stop: () => void }) {
  const finished = step >= moments.length;
  const current = moments[Math.min(step, moments.length - 1)];
  return <div className="reveal" role="dialog" aria-modal="true"><button className="reveal-close" onClick={() => { stop(); close(); }}>×</button><div className="reveal-count">{finished ? "THE WHOLE LITTLE THING" : `LAYER 0${step + 1} / 0${moments.length}`}</div>{finished ? <><div className="reveal-orb"><span>♫</span></div><h2>four little moments.<br /><em>one tiny song.</em></h2><p>{isPlaying ? "It’s playing now. Let it be a little weird." : "Press play whenever you’re ready."}</p><button onClick={close}>keep it close ↗</button></> : <><div className="reveal-photo">{current.imageUrl && <img src={current.imageUrl} alt="" />}</div><p className="reveal-name">{current.creatorName}&apos;s moment</p><h2>“{current.caption}”<br /><em>{current.interpretation || roleDetails[current.role].line}</em></h2><div className="reveal-code">{current.caption.toLowerCase().slice(0, 12)} → {current.role}<br /><span>sound(&quot;little thing&quot;).soften()</span></div></>}</div>;
}

function useTinySong() {
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const clipsRef = useRef<HTMLAudioElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const stop = useMemo(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    clipsRef.current.forEach((clip) => { clip.pause(); clip.src = ""; }); clipsRef.current = [];
    if (contextRef.current) { contextRef.current.close(); contextRef.current = null; }
    setIsPlaying(false);
  }, []);
  const play = useMemo(() => (moments: Moment[]) => {
    stop();
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass(); contextRef.current = ctx;
    clipsRef.current = moments.flatMap((moment) => {
      if (!moment.soundUrl) return [];
      const clip = new Audio(moment.soundUrl); clip.volume = .17; void clip.play().catch(() => undefined); return [clip];
    });
    const master = ctx.createGain(); master.gain.value = 0.16; master.connect(ctx.destination);
    const now = ctx.currentTime + 0.05;
    const tone = (time: number, frequency: number, length: number, type: OscillatorType, gain: number) => { const osc = ctx.createOscillator(); const amp = ctx.createGain(); osc.type = type; osc.frequency.value = frequency; amp.gain.setValueAtTime(0.0001, time); amp.gain.exponentialRampToValueAtTime(gain, time + 0.02); amp.gain.exponentialRampToValueAtTime(0.0001, time + length); osc.connect(amp).connect(master); osc.start(time); osc.stop(time + length + 0.03); };
    const has = (role: Role) => moments.some((moment) => moment.role === role);
    for (let beat = 0; beat < 72; beat++) { const time = now + beat * 0.25; if (has("bass") && beat % 4 === 0) tone(time, beat % 8 === 0 ? 98 : 110, .23, "sine", .7); if (has("percussion") && beat % 2 === 0) tone(time, 120 + (beat % 3) * 40, .045, "square", .22); if (has("melody") && beat % 4 === 2) tone(time, [392, 440, 494, 523][beat % 4], .19, "triangle", .23); }
    if (has("atmosphere")) tone(now, 196, 17.8, "sine", .08);
    setIsPlaying(true); timerRef.current = window.setTimeout(stop, 18_200);
  }, [stop]);
  return { isPlaying, play, stop };
}
