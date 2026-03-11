const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = "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";

const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

type AIStatus = "ok" | "slow" | "limited";
let aiStatus: AIStatus = "ok";
const listeners = new Set<(s: AIStatus) => void>();
export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: AIStatus) => void) {
  listeners.add(fn); return () => listeners.delete(fn);
}
function setStatus(s: AIStatus) { aiStatus = s; listeners.forEach(fn => fn(s)); }

const cache = new Map<string, { result: string; ts: number }>();
const CACHE_MS = 45_000;

async function tryGroq(model: string, sys: string, user: string, maxTokens: number, temp: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user }
        ],
        max_tokens: maxTokens,
        temperature: temp,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) { console.warn(`Groq ${model} failed: ${res.status}`); return null; }
    const text = await res.text();
    if (!text) return null;
    const data = JSON.parse(text);
    return data.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    clearTimeout(timer);
    console.warn(`Groq ${model} error:`, e);
    return null;
  }
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 1500, temperature = 0.7 } = options ?? {};
  const cacheKey = (systemPrompt + userPrompt).slice(0, 200);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.result;

  for (let i = 0; i < GROQ_MODELS.length; i++) {
    if (i >= 2) setStatus("slow");
    const r = await tryGroq(GROQ_MODELS[i], systemPrompt, userPrompt, maxTokens, temperature);
    if (r) {
      setStatus("ok");
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  setStatus("limited");
  throw new Error("All AI models failed. Please try again in a few seconds.");
}

export async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const result = await callAI(systemPrompt, userPrompt);
  const words = result.split(" ");
  let full = "";
  for (const word of words) {
    const chunk = word + " ";
    full += chunk;
    onChunk(chunk);
    await new Promise(r => setTimeout(r, 18));
  }
  return full.trim();
}

export function parseJsonSafely(text: string): any {
  if (!text) return null;
  let s = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(s); } catch {}
  const objStart = s.indexOf("{");
  if (objStart !== -1) {
    let snippet = s.slice(objStart);
    let open = 0, lastValid = 0;
    for (let i = 0; i < snippet.length; i++) {
      if (snippet[i] === "{") open++;
      if (snippet[i] === "}") { open--; if (open === 0) { lastValid = i; break; } }
    }
    if (lastValid > 0) { try { return JSON.parse(snippet.slice(0, lastValid + 1)); } catch {} }
    while (open > 0) { snippet += "}"; open--; }
    try { return JSON.parse(snippet); } catch {}
  }
  const arrStart = s.indexOf("[");
  if (arrStart !== -1) {
    let snippet = s.slice(arrStart);
    let open = 0;
    for (let i = 0; i < snippet.length; i++) {
      if (snippet[i] === "[") open++;
      if (snippet[i] === "]") { open--; if (open === 0) { try { return JSON.parse(snippet.slice(0, i + 1)); } catch {} break; } }
    }
  }
  return null;
}

export const parseJsonFromAI = parseJsonSafely;
export const parseJsonFromResponse = parseJsonSafely;
export const callGroq = callAI;
export default callAI;
