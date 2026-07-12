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
