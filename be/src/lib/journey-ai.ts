import { z } from "zod";
import { GEMINI_API_KEY, OPENAI_API_KEY, XAI_API_KEY } from "../config/secrets";
import type { PhaseSegment } from "./engine";

type AIProvider = "openai" | "gemini" | "grok";
const PROMPT_VERSION = "journey_v2_prompt_2";

const aiNarrativeSchema = z.object({
  segments: z.array(
    z.object({
      segmentId: z.string().min(1),
      phaseMeaning: z.string().min(16),
      likelyManifestation: z.string().min(16),
      caution: z.string().min(12),
      action: z.string().min(12),
      timingReference: z.string().min(8),
    }),
  ),
});

type NarrativeSegment = z.infer<typeof aiNarrativeSchema>["segments"][number];

const weeklySchema = z.object({
  theme: z.string().min(8),
  upayaTitle: z.string().min(6),
  upayaInstruction: z.string().min(12),
});

const forecastSchema = z.object({
  summary: z.string().min(20),
  q1: z.string().min(8),
  q2: z.string().min(8),
  q3: z.string().min(8),
  q4: z.string().min(8),
});

const providerFromEnv = (): AIProvider => {
  const value = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase();
  if (value === "gemini" || value === "grok" || value === "openai") return value;
  return "openai";
};

const modelFromEnv = (provider: AIProvider): string => {
  if (provider === "openai") return process.env.OPENAI_MODEL?.trim() || "gpt-5";
  if (provider === "gemini") return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  return process.env.GROK_MODEL?.trim() || "grok-4-0709";
};

const extractJson = (raw: string) => {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last < 0 || last <= first) throw new Error("invalid_response:json_not_found");
  return cleaned.slice(first, last + 1);
};

const languageInstruction = (languageCode: string) => {
  if (languageCode === "te") return "Respond in simple Telugu with clear, everyday phrasing.";
  if (languageCode === "hi") return "Respond in simple Hindi with clear, everyday phrasing.";
  return "Respond in simple English with short, clear sentences.";
};

const explanationInstruction = (mode: "simple" | "traditional") =>
  mode === "traditional"
    ? "Keep Jyotish terms visible, then explain each line in plain language."
    : "Use minimal jargon; explain terms as if user is 15 years old.";

const contextForPrompt = (segments: PhaseSegment[]) =>
  segments.map((segment) => ({
    segmentId: segment.phaseSegmentId,
    phase: `${segment.mdLord}-${segment.adLord ?? ""}-${segment.pdLord ?? ""}`.replace(/-$/, ""),
    startUtc: segment.startUtc,
    endUtc: segment.endUtc,
    triggerTypes: segment.highlights.map((h) => h.triggerType),
    triggerRefs: segment.highlights.map((h) => h.triggerRef ?? ""),
    facts: segment.highlights.map((h) => h.detail),
  }));

const buildJourneyPrompt = (input: {
  languageCode: string;
  explanationMode: "simple" | "traditional";
  segments: PhaseSegment[];
}) => {
  const context = contextForPrompt(input.segments);
  return [
    "You are a precise Vedic astrology narrative generator.",
    "Do not invent chart factors. Use only provided deterministic facts.",
    "Never produce generic statements. Every line must reference phase lords or trigger factors.",
    languageInstruction(input.languageCode),
    explanationInstruction(input.explanationMode),
    "Output STRICT JSON only with shape:",
    '{ "segments": [{ "segmentId": string, "phaseMeaning": string, "likelyManifestation": string, "caution": string, "action": string, "timingReference": string }] }',
    "Rules:",
    "1. Keep each field concise (1-2 lines).",
    "2. timingReference must include date window context.",
    "3. phaseMeaning must include MD/AD/PD lords.",
    "4. likelyManifestation must be personalized to provided phase/trigger facts.",
    "5. No fear language, no guarantees.",
    "6. Keep planet names in English (e.g., Saturn, Mercury, Moon) even in non-English output.",
    `Deterministic context JSON:\n${JSON.stringify(context)}`,
  ].join("\n");
};

const extractOpenAIText = (payload: any): string => {
  if (typeof payload?.output_text === "string" && payload.output_text.trim().length > 0) return payload.output_text;
  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const texts: string[] = [];
  for (const out of outputs) {
    const content = Array.isArray(out?.content) ? out.content : [];
    for (const part of content) {
      if (typeof part?.text === "string") texts.push(part.text);
    }
  }
  return texts.join("\n").trim();
};

const connectorOpenAI = async (prompt: string): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY()}`,
    },
    body: JSON.stringify({
      model: modelFromEnv("openai"),
      input: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`openai_http_${response.status}:${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  const text = extractOpenAIText(data);
  if (!text) throw new Error("invalid_response:empty_body");
  return text;
};

const connectorGemini = async (prompt: string): Promise<string> => {
  const model = modelFromEnv("gemini");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY(),
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });
  if (!response.ok) throw new Error(`gemini_http_${response.status}:${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") throw new Error("invalid_response:empty_body");
  return text;
};

const connectorGrok = async (prompt: string): Promise<string> => {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${XAI_API_KEY()}`,
    },
    body: JSON.stringify({
      model: modelFromEnv("grok"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`grok_http_${response.status}:${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") throw new Error("invalid_response:empty_body");
  return text;
};

const callAI = async (prompt: string): Promise<string> => {
  const provider = providerFromEnv();
  if (provider === "gemini") return connectorGemini(prompt);
  if (provider === "grok") return connectorGrok(prompt);
  return connectorOpenAI(prompt);
};

export const currentAIProvider = () => providerFromEnv();

export const generateJourneyNarrative = async (input: {
  languageCode: string;
  explanationMode: "simple" | "traditional";
  segments: PhaseSegment[];
}): Promise<{ promptVersion: string; blocks: NarrativeSegment[]; provider: AIProvider }> => {
  const prompt = buildJourneyPrompt(input);
  const raw = await callAI(prompt);
  const parsed = aiNarrativeSchema.parse(JSON.parse(extractJson(raw)));

  const byId = new Map(parsed.segments.map((segment) => [segment.segmentId, segment]));
  const ordered = input.segments.map((seg) => {
    const found = byId.get(seg.phaseSegmentId);
    if (!found) throw new Error(`invalid_response:missing_segment_${seg.phaseSegmentId}`);
    return found;
  });

  return { promptVersion: PROMPT_VERSION, blocks: ordered, provider: providerFromEnv() };
};

export const generateWeeklyNarrative = async (input: {
  languageCode: string;
  city: string;
  weekStartUtc: string;
  windows: {
    support: Array<{ startUtc: string; endUtc: string; reason: string }>;
    friction: Array<{ startUtc: string; endUtc: string; reason: string }>;
  };
}): Promise<{ theme: string; upayaTitle: string; upayaInstruction: string; promptVersion: string; provider: AIProvider }> => {
  const prompt = [
    "You are a Vedic weekly guidance writer.",
    languageInstruction(input.languageCode),
    "Output STRICT JSON only with shape:",
    '{ "theme": string, "upayaTitle": string, "upayaInstruction": string }',
    "Rules:",
    "1. Mention the city context and practical timing sensitivity.",
    "2. No fear language and no guarantees.",
    `City: ${input.city}`,
    `WeekStartUtc: ${input.weekStartUtc}`,
    `Windows: ${JSON.stringify(input.windows)}`,
  ].join("\n");

  const raw = await callAI(prompt);
  const parsed = weeklySchema.parse(JSON.parse(extractJson(raw)));
  return { ...parsed, promptVersion: `${PROMPT_VERSION}_weekly_1`, provider: providerFromEnv() };
};

export const generateForecastNarrative = async (input: {
  languageCode: string;
  profileContext: Record<string, unknown>;
}): Promise<{ summary: string; q1: string; q2: string; q3: string; q4: string; promptVersion: string; provider: AIProvider }> => {
  const prompt = [
    "You are a Vedic 12-month forecast writer.",
    languageInstruction(input.languageCode),
    "Output STRICT JSON only with shape:",
    '{ "summary": string, "q1": string, "q2": string, "q3": string, "q4": string }',
    "Rules:",
    "1. Keep each quarter line practical and specific to provided profile context.",
    "2. No generic filler, no guarantee language.",
    `ProfileContext: ${JSON.stringify(input.profileContext)}`,
  ].join("\n");

  const raw = await callAI(prompt);
  const parsed = forecastSchema.parse(JSON.parse(extractJson(raw)));
  return { ...parsed, promptVersion: `${PROMPT_VERSION}_forecast_1`, provider: providerFromEnv() };
};
