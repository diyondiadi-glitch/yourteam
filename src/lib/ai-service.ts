// ── AI Service: Groq primary, OpenRouter fallback ─────────────────
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = "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";
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_KEY = "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";
const OR_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${OR_KEY}`,
  "HTTP-Referer": "https://creatorbrain.app",
  "X-Title": "CreatorBrain",
};
const OR_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
];

type AIStatus = "ok" | "slow" | "limited";
let aiStatus: AIStatus = "ok";
const listeners = new Set<(s: AIStatus) => void>();
export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: AIStatus) => void) {
  listeners.add(fn); return () => { listeners.delete(fn); };
}
function setStatus(s: AIStatus) { aiStatus = s; listeners.forEach(fn => fn(s)); }

const cache = new Map<string, { result: string; ts: number }>();
const CACHE_MS = 45_000;

async function tryGroq(model: string, sys: string, user: string, maxTokens: number, temp: number): Promise<string | null> {
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        max_tokens: maxTokens,
        temperature: temp,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function tryOpenRouter(model: string, sys: string, user: string, maxTokens: number, temp: number): Promise<string | null> {
  try {
    const res = await fetch(OR_URL, {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        max_tokens: maxTokens,
        temperature: temp,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429 || res.status === 503 || !res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.7 } = options ?? {};
  const cacheKey = (systemPrompt + userPrompt).slice(0, 200);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.result;

  // Try Groq first
  for (let i = 0; i < GROQ_MODELS.length; i++) {
    if (i >= 2) setStatus("slow");
    const r = await tryGroq(GROQ_MODELS[i], systemPrompt, userPrompt, maxTokens, temperature);
    if (r) {
      setStatus("ok");
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  // Fallback to OpenRouter
  for (let i = 0; i < OR_MODELS.length; i++) {
    setStatus("slow");
    const r = await tryOpenRouter(OR_MODELS[i], systemPrompt, userPrompt, maxTokens, temperature);
    if (r) {
      setStatus("ok");
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  setStatus("limited");
  return "AI is briefly resting. Your channel data loaded — please click Try Again in a few seconds.";
}

export async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  // Try streaming via OpenRouter
  for (const model of OR_MODELS.slice(0, 3)) {
    try {
      const res = await fetch(OR_URL, {
        method: "POST",
        headers: OR_HEADERS,
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          max_tokens: 2000,
          temperature: 0.7,
          stream: true,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok || !res.body) continue;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "", buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const chunk = JSON.parse(json);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) { full += content; onChunk(content); }
          } catch { /* partial */ }
        }
      }
      if (full) { setStatus("ok"); return full; }
    } catch { continue; }
  }
  // Fallback to non-streaming
  const result = await callAI(systemPrompt, userPrompt);
  onChunk(result);
  return result;
}

export function parseJsonSafely(text: string): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const s = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(s); } catch {}
  const obj = s.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  const arr = s.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  return null;
}

export const parseJsonFromAI = parseJsonSafely;
export const parseJsonFromResponse = parseJsonSafely;
export const safeJsonParse = parseJsonSafely;
export const callGroq = callAI;
export default callAI;
