import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const validRoles = ["bass", "atmosphere", "percussion", "melody"] as const;
type Role = (typeof validRoles)[number];
type Interpretation = { role: Role; interpretation: string; soundPrompt: string };
function fallback(role: Role, caption: string): Interpretation {
  const prompts: Record<Role, string> = { bass: "a warm low pulse made from a small everyday sound", atmosphere: "soft room tone and distant air, slow, warm, and spacious", percussion: "a gentle found-object tap with a playful, crisp rhythm", melody: "a bright tiny chime phrase, human and imperfect" };
  const reveals: Record<Role, string> = { bass: "became the soft, steady bass.", atmosphere: "became the air around everything.", percussion: "became the rhythm in the room.", melody: "became the little melody on top." };
  return { role, soundPrompt: `${prompts[role]}. Inspired by: ${caption}`, interpretation: reveals[role] };
}
function base64(buffer: ArrayBuffer) { const bytes = new Uint8Array(buffer); let binary = ""; for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]); return btoa(binary); }

export const interpretMoment = internalAction({ args: { momentId: v.id("moments") }, handler: async (ctx, { momentId }) => {
  const moment = await ctx.runQuery(internal.aiQueries.getMomentForInterpretation, { momentId }); if (!moment) return;
  const defaultInterpretation = fallback(moment.role, moment.caption); const geminiKey = process.env.GEMINI_API_KEY; let interpretation = defaultInterpretation; let usedGemini = false;
  if (geminiKey) try {
    const photo = await fetch(moment.imageUrl); if (!photo.ok) throw new Error("Could not read the uploaded photo.");
    const prompt = `You are the invisible musical intuition inside Boppi. Look at this private daily photo and its caption: "${moment.caption}". Return JSON only. Choose one role: bass, atmosphere, percussion, or melody. Write a warm interpretation sentence beginning with “became”. Write a concise sound-effect prompt describing real-world sound material; no artist names.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: photo.headers.get("content-type") || "image/jpeg", data: base64(await photo.arrayBuffer()) } }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { role: { type: "STRING", enum: [...validRoles] }, interpretation: { type: "STRING" }, soundPrompt: { type: "STRING" } }, required: ["role", "interpretation", "soundPrompt"] } } }) });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}.`); const payload = await response.json(); const parsed = JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text || "{}") as Partial<Interpretation>;
    if (parsed.role && validRoles.includes(parsed.role) && parsed.interpretation && parsed.soundPrompt) { interpretation = { role: parsed.role, interpretation: parsed.interpretation.slice(0, 100), soundPrompt: parsed.soundPrompt.slice(0, 240) }; usedGemini = true; }
  } catch (error) { console.warn("Boppi used its built-in interpretation", error); }
  await ctx.runMutation(internal.groups.applyInterpretation, { momentId, ...interpretation, generationStatus: usedGemini ? "ready" : "fallback" });
} });
