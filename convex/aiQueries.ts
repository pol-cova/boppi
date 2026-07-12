import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getMomentForInterpretation = internalQuery({
  args: { momentId: v.id("moments") },
  handler: async (ctx, { momentId }) => {
    const moment = await ctx.db.get(momentId);
    if (!moment) return null;
    const imageUrl = await ctx.storage.getUrl(moment.photoId);
    if (!imageUrl) return null;
    return { caption: moment.caption, role: moment.role, photoId: moment.photoId, imageUrl };
  },
});

export const getSongForComposition = internalQuery({
  args: { songId: v.id("songs") },
  handler: async (ctx, { songId }) => {
    const song = await ctx.db.get(songId);
    if (!song) return null;
    const moments = await Promise.all(song.momentIds.map(async (id) => {
      const moment = await ctx.db.get(id);
      if (!moment) return null;
      return { caption: moment.caption, role: moment.role, imageUrl: await ctx.storage.getUrl(moment.photoId) };
    }));
    return { song, moments: moments.filter((moment): moment is NonNullable<typeof moment> => moment !== null) };
  },
});

export const getPublicBopForComposition = internalQuery({
  args: { bopId: v.id("publicBops") },
  handler: async (ctx, { bopId }) => {
    const bop = await ctx.db.get(bopId);
    if (!bop) return null;
    return { bop, imageUrl: bop.photoId ? await ctx.storage.getUrl(bop.photoId) : null };
  },
});
