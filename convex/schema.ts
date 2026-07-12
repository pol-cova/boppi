import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    inviteCode: v.string(),
    createdAt: v.number(),
  }).index("by_invite", ["inviteCode"]),

  members: defineTable({
    groupId: v.id("groups"),
    sessionId: v.string(),
    displayName: v.string(),
    joinedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_group", ["groupId"])
    .index("by_group_session", ["groupId", "sessionId"]),

  moments: defineTable({
    groupId: v.id("groups"),
    memberId: v.id("members"),
    creatorName: v.string(),
    caption: v.string(),
    photoId: v.id("_storage"),
    day: v.string(),
    role: v.union(v.literal("bass"), v.literal("atmosphere"), v.literal("percussion"), v.literal("melody")),
    color: v.union(v.literal("pink"), v.literal("lime"), v.literal("blue"), v.literal("orange")),
    interpretation: v.optional(v.string()),
    soundPrompt: v.optional(v.string()),
    soundId: v.optional(v.id("_storage")),
    generationStatus: v.optional(v.union(v.literal("pending"), v.literal("ready"), v.literal("fallback"), v.literal("failed"))),
    createdAt: v.number(),
  })
    .index("by_group_day", ["groupId", "day"])
    .index("by_member_day", ["memberId", "day"]),

  songs: defineTable({
    groupId: v.id("groups"),
    day: v.string(),
    title: v.string(),
    shareCode: v.string(),
    momentIds: v.array(v.id("moments")),
    strudelCode: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_group_day", ["groupId", "day"])
    .index("by_share", ["shareCode"]),

  publicBops: defineTable({
    creatorName: v.string(),
    caption: v.string(),
    vibe: v.string(),
    photoId: v.optional(v.id("_storage")),
    shareCode: v.string(),
    title: v.string(),
    strudelCode: v.string(),
    generationStatus: v.union(v.literal("pending"), v.literal("ready"), v.literal("fallback")),
    createdAt: v.number(),
  }).index("by_share", ["shareCode"]).index("by_created", ["createdAt"]),
});
