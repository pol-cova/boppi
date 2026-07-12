import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const roles = ["bass", "atmosphere", "percussion", "melody"] as const;
const colors = ["pink", "lime", "blue", "orange"] as const;
const fallbackStrudel = (seed = 0) => `setcps(0.72)\nstack(\n  note("<c4 eb4 f4 g4>*2").s("triangle").gain(0.7),\n  note("<c2 c2 ab1 bb1>").s("sine").gain(0.55),\n  s("bd ~ [~ bd] ~").gain(0.5)\n).slow(${seed % 2 ? 2 : 1})`;

const dayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

function titleFrom(captions: string[]) {
  const first = captions[0]?.replace(/[.!?…]/g, "").trim() || "Little";
  const word = first.split(/\s+/).slice(0, 2).join(" ");
  const endings = ["after dark", "in stereo", "and a little bit more", "on a good day"];
  return `${word[0]?.toUpperCase() || "L"}${word.slice(1)}, ${endings[captions.length % endings.length]}`.slice(0, 40);
}

async function roomForSession(ctx: { db: any }, sessionId: string) {
  const membership = await ctx.db
    .query("members")
    .withIndex("by_session", (q: any) => q.eq("sessionId", sessionId))
    .first();
  if (!membership) return null;
  const group = await ctx.db.get(membership.groupId);
  return group ? { group, membership } : null;
}

export const createGroup = mutation({
  args: { name: v.string(), displayName: v.string(), sessionId: v.string(), inviteCode: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 32);
    const displayName = args.displayName.trim().slice(0, 24);
    const inviteCode = args.inviteCode.trim().toLowerCase();
    if (!name || !displayName) throw new Error("Give the room and yourself a name.");
    if (!/^[a-z0-9]{20,64}$/.test(inviteCode)) throw new Error("That room code was not safe enough. Please try again.");
    const existing = await roomForSession(ctx, args.sessionId);
    if (existing) return { inviteCode: existing.group.inviteCode, groupId: existing.group._id };
    const codeInUse = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", inviteCode)).first();
    if (codeInUse) throw new Error("That room code is already in use. Please try again.");
    const groupId = await ctx.db.insert("groups", { name, inviteCode, createdAt: Date.now() });
    await ctx.db.insert("members", { groupId, sessionId: args.sessionId, displayName, joinedAt: Date.now() });
    return { inviteCode, groupId };
  },
});

export const joinGroup = mutation({
  args: { inviteCode: v.string(), displayName: v.string(), sessionId: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", args.inviteCode)).first();
    if (!group) throw new Error("That little room doesn’t exist anymore.");
    const displayName = args.displayName.trim().slice(0, 24);
    if (!displayName) throw new Error("Tell us your name first.");
    const existing = await ctx.db.query("members").withIndex("by_group_session", (q) => q.eq("groupId", group._id).eq("sessionId", args.sessionId)).first();
    if (!existing) {
      const members = await ctx.db.query("members").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
      if (members.length >= 4) throw new Error("This little room is full (four people max).");
      await ctx.db.insert("members", { groupId: group._id, sessionId: args.sessionId, displayName, joinedAt: Date.now() });
    }
    return { inviteCode: group.inviteCode, groupId: group._id };
  },
});

export const generateUploadUrl = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const room = await roomForSession(ctx, sessionId);
    if (!room) throw new Error("Join a room before uploading a moment.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createMoment = mutation({
  args: { sessionId: v.string(), caption: v.string(), photoId: v.id("_storage") },
  handler: async (ctx, args) => {
    const room = await roomForSession(ctx, args.sessionId);
    if (!room) throw new Error("Join a room before adding a moment.");
    const caption = args.caption.trim().slice(0, 60);
    if (!caption) throw new Error("Give your moment a tiny caption.");
    const day = dayKey();
    const finishedSong = await ctx.db.query("songs").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id).eq("day", day)).first();
    if (finishedSong) throw new Error("Today’s bop is already made — come back with a new little thing tomorrow.");
    const previous = await ctx.db.query("moments").withIndex("by_member_day", (q) => q.eq("memberId", room.membership._id).eq("day", day)).first();
    if (previous) throw new Error("You already added your little thing today.");
    const allToday = await ctx.db.query("moments").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id).eq("day", day)).collect();
    if (allToday.length >= 4) throw new Error("This bop already has four little things.");
    const index = allToday.length;
    const momentId = await ctx.db.insert("moments", {
      groupId: room.group._id,
      memberId: room.membership._id,
      creatorName: room.membership.displayName,
      caption,
      photoId: args.photoId,
      day,
      role: roles[index],
      color: colors[index],
      generationStatus: "pending",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.ai.interpretMoment, { momentId });
    return momentId;
  },
});

export const makeBop = mutation({
  args: { sessionId: v.string(), shareCode: v.string() },
  handler: async (ctx, args) => {
    const room = await roomForSession(ctx, args.sessionId);
    if (!room) throw new Error("Join a room before making a bop.");
    const day = dayKey();
    const existing = await ctx.db.query("songs").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id).eq("day", day)).first();
    if (existing) return { songId: existing._id, shareCode: existing.shareCode, isNew: false };
    const moments = await ctx.db.query("moments").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id).eq("day", day)).collect();
    if (moments.length < 2) throw new Error("A bop needs at least two little things.");
    const shareCode = args.shareCode.trim().toLowerCase();
    if (!/^[a-z0-9]{20,64}$/.test(shareCode)) throw new Error("That share link was not safe enough. Please try again.");
    const codeInUse = await ctx.db.query("songs").withIndex("by_share", (q) => q.eq("shareCode", shareCode)).first();
    if (codeInUse) throw new Error("That share link is already in use. Please try again.");
    const songId = await ctx.db.insert("songs", {
      groupId: room.group._id,
      day,
      title: titleFrom(moments.map((moment) => moment.caption)),
      shareCode,
      momentIds: moments.map((moment) => moment._id),
      strudelCode: fallbackStrudel(moments.length),
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.ai.composeSong, { songId });
    return { songId, shareCode, isNew: true };
  },
});

export const generatePublicUploadUrl = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    if (!/^[a-z0-9-]{20,64}$/.test(sessionId)) throw new Error("That tiny session was not safe enough.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createPublicBop = mutation({
  args: { sessionId: v.string(), creatorName: v.string(), caption: v.string(), vibe: v.string(), shareCode: v.string(), photoId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    if (!/^[a-z0-9-]{20,64}$/.test(args.sessionId)) throw new Error("That tiny session was not safe enough.");
    const creatorName = args.creatorName.trim().slice(0, 24);
    const caption = args.caption.trim().slice(0, 100);
    const vibe = args.vibe.trim().slice(0, 40);
    const shareCode = args.shareCode.trim().toLowerCase();
    if (!creatorName || !caption || !vibe) throw new Error("Give your bop a name, feeling, and vibe.");
    if (!/^[a-z0-9]{20,64}$/.test(shareCode)) throw new Error("That share link was not safe enough.");
    if (await ctx.db.query("publicBops").withIndex("by_share", (q) => q.eq("shareCode", shareCode)).first()) throw new Error("That share link is already in use.");
    const bopId = await ctx.db.insert("publicBops", { creatorName, caption, vibe, photoId: args.photoId, shareCode, title: "your little bop", strudelCode: fallbackStrudel(caption.length), generationStatus: "pending", createdAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.ai.composePublicBop, { bopId });
    return { bopId, shareCode };
  },
});

export const getHome = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const room = await roomForSession(ctx, args.sessionId);
    if (!room) return null;
    const day = dayKey();
    const members = await ctx.db.query("members").withIndex("by_group", (q) => q.eq("groupId", room.group._id)).collect();
    const moments = await ctx.db.query("moments").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id).eq("day", day)).collect();
    const populatedMoments = await Promise.all(moments.map(async (moment) => ({ ...moment, imageUrl: await ctx.storage.getUrl(moment.photoId), soundUrl: moment.soundId ? await ctx.storage.getUrl(moment.soundId) : null })));
    const todaySong = await ctx.db.query("songs").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id).eq("day", day)).first();
    const archiveBase = await ctx.db.query("songs").withIndex("by_group_day", (q) => q.eq("groupId", room.group._id)).order("desc").take(8);
    const archive = await Promise.all(archiveBase.map(async (song) => {
      const songMoments = await Promise.all(song.momentIds.map(async (id) => {
        const moment = await ctx.db.get(id);
        return moment ? { ...moment, soundUrl: moment.soundId ? await ctx.storage.getUrl(moment.soundId) : null } : null;
      }));
      return { ...song, moments: songMoments.filter((moment): moment is NonNullable<typeof moment> => moment !== null) };
    }));
    return { group: room.group, me: room.membership, members, moments: populatedMoments, todaySong, archive };
  },
});

export const getSharedBop = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const song = await ctx.db.query("songs").withIndex("by_share", (q) => q.eq("shareCode", args.shareCode)).first();
    if (!song) return null;
    const group = await ctx.db.get(song.groupId);
    const moments = await Promise.all(song.momentIds.map(async (id) => {
      const moment = await ctx.db.get(id);
      return moment ? { ...moment, imageUrl: await ctx.storage.getUrl(moment.photoId), soundUrl: moment.soundId ? await ctx.storage.getUrl(moment.soundId) : null } : null;
    }));
    return { song, group, moments: moments.filter((moment): moment is NonNullable<typeof moment> => moment !== null) };
  },
});

export const getPublicBop = query({
  args: { shareCode: v.string() },
  handler: async (ctx, { shareCode }) => {
    const bop = await ctx.db.query("publicBops").withIndex("by_share", (q) => q.eq("shareCode", shareCode)).first();
    if (!bop) return null;
    return { ...bop, imageUrl: bop.photoId ? await ctx.storage.getUrl(bop.photoId) : null };
  },
});

export const listPublicBops = query({
  args: {},
  handler: async (ctx) => {
    const bops = await ctx.db.query("publicBops").withIndex("by_created").order("desc").take(24);
    return Promise.all(bops.map(async (bop) => ({ ...bop, imageUrl: bop.photoId ? await ctx.storage.getUrl(bop.photoId) : null })));
  },
});

export const applyInterpretation = internalMutation({
  args: {
    momentId: v.id("moments"),
    role: v.union(v.literal("bass"), v.literal("atmosphere"), v.literal("percussion"), v.literal("melody")),
    interpretation: v.string(),
    soundPrompt: v.string(),
    soundId: v.optional(v.id("_storage")),
    generationStatus: v.union(v.literal("ready"), v.literal("fallback"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.momentId, {
      role: args.role,
      interpretation: args.interpretation,
      soundPrompt: args.soundPrompt,
      soundId: args.soundId,
      generationStatus: args.generationStatus,
    });
  },
});

export const applySongComposition = internalMutation({
  args: { songId: v.id("songs"), title: v.string(), strudelCode: v.string() },
  handler: async (ctx, args) => { await ctx.db.patch(args.songId, { title: args.title.slice(0, 40), strudelCode: args.strudelCode.slice(0, 1600) }); },
});

export const applyPublicComposition = internalMutation({
  args: { bopId: v.id("publicBops"), title: v.string(), strudelCode: v.string(), generationStatus: v.union(v.literal("ready"), v.literal("fallback")) },
  handler: async (ctx, args) => { await ctx.db.patch(args.bopId, { title: args.title.slice(0, 40), strudelCode: args.strudelCode.slice(0, 1600), generationStatus: args.generationStatus }); },
});
