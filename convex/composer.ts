import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

type Composition = { title: string; strudelCode: string };
const fallbackCode = `setcps(0.72)
stack(
  note("<c4 eb4 f4 g4>*2").s("triangle").gain(0.7),
  note("<c2 c2 ab1 bb1>").s("sine").gain(0.55),
  s("bd ~ [~ bd] ~").gain(0.5)
).slow(2)`;
function base64(buffer: ArrayBuffer) { const bytes = new Uint8Array(buffer); let binary = ""; for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]); return btoa(binary); }
function safeStrudel(code: string | undefined) {
  if (!code || code.length > 1600) return fallbackCode;
  if (/\b(import|export|fetch|window|document|globalThis|eval|Function|constructor|prototype|process)\b|[{};]/i.test(code)) return fallbackCode;
  if (!/^[a-zA-Z0-9_.'"`()<>\[\],\n\r\s*+\-/.=]+$/.test(code)) return fallbackCode;
  return code;
}
function fallbackComposition(captions: string[]): Composition { const seed = captions.join(" ").trim().split(/\s+/).slice(0, 3).join(" ") || "today"; return { title: `${seed[0].toUpperCase()}${seed.slice(1)}, in stereo`, strudelCode: fallbackCode }; }
async function composeWithGemini(parts: Array<{ caption: string; imageUrl?: string | null }>, vibe: string) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  const imageParts = await Promise.all(parts.filter((part) => part.imageUrl).map(async (part) => { const response = await fetch(part.imageUrl!); if (!response.ok) return null; return { inline_data: { mime_type: response.headers.get("content-type") || "image/jpeg", data: base64(await response.arrayBuffer()) } }; }));
  const prompt = `You are Boppi's tiny music director. Look at the attached everyday photos and captions, then compose a warm, playful 18-second music loop for the vibe "${vibe}". Return JSON only. title: a poetic title of max 40 characters. strudelCode: valid Strudel code using only setcps, stack, note, s, .s, .gain, .slow, and simple note/sample strings. Use synth names triangle, sine, sawtooth, bd, hh, sd. No imports, variables, braces, semicolons, network calls, or arbitrary JavaScript. Make it a real little song: melody, bass, and rhythm. Captions: ${parts.map((part) => part.caption).join(" | ")}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...imageParts.filter(Boolean)] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { title: { type: "STRING" }, strudelCode: { type: "STRING" } }, required: ["title", "strudelCode"] } } }) });
  if (!response.ok) throw new Error(`Gemini composition returned ${response.status}.`); const payload = await response.json(); const parsed = JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text || "{}") as Partial<Composition>;
  if (!parsed.title || !parsed.strudelCode) return null; return { title: parsed.title, strudelCode: safeStrudel(parsed.strudelCode) };
}
export const composeSong: any = internalAction({ args: { songId: v.id("songs") }, handler: async (ctx, { songId }) => {
  const data = await ctx.runQuery(internal.aiQueries.getSongForComposition, { songId }); if (!data) return; const fallback = fallbackComposition(data.moments.map((moment) => moment.caption));
  try { const result = await composeWithGemini(data.moments, "the shared feeling of a good ordinary day"); if (result) return await ctx.runMutation(internal.groups.applySongComposition, { songId, ...result }); } catch (error) { console.warn("Boppi used its built-in Strudel composition", error); }
  await ctx.runMutation(internal.groups.applySongComposition, { songId, ...fallback });
} });
export const composePublicBop: any = internalAction({ args: { bopId: v.id("publicBops") }, handler: async (ctx, { bopId }) => {
  const data = await ctx.runQuery(internal.aiQueries.getPublicBopForComposition, { bopId }); if (!data) return; const fallback = fallbackComposition([data.bop.caption]);
  try { const result = await composeWithGemini([{ caption: data.bop.caption, imageUrl: data.imageUrl }], data.bop.vibe); if (result) return await ctx.runMutation(internal.groups.applyPublicComposition, { bopId, ...result, generationStatus: "ready" }); } catch (error) { console.warn("Boppi used its built-in public Strudel composition", error); }
  await ctx.runMutation(internal.groups.applyPublicComposition, { bopId, ...fallback, generationStatus: "fallback" });
} });
