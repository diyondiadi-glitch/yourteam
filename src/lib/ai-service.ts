const GROQ_API_KEY = "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";

const models = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

// Track rate limit status globally
let aiStatus: "ok" | "slow" | "limited" = "ok";
let cooldownUntil = 0;
const statusListeners: Set<(s: typeof aiStatus) => void> = new Set();

// Request deduplication cache (30 second TTL)
const requestCache: Map<string, { result: string; timestamp: number }> = new Map();
const CACHE_TTL = 30000;

export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: typeof aiStatus) => void): () => void {
  statusListeners.add(fn);
  return () => { statusListeners.delete(fn); };
}
function setStatus(s: typeof aiStatus) {
  aiStatus = s;
  statusListeners.forEach(fn => fn(s));
}

// Robust JSON parser that handles all edge cases
export function parseJsonSafely(text: string): any {
  if (!text) return null;
  
  // Try direct parse
  try { return JSON.parse(text); } catch {}
  
  // Strip markdown code blocks
  const stripped = text
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  try { return JSON.parse(stripped); } catch {}
  
  // Extract first JSON object
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  if (objMatch) { 
    try { return JSON.parse(objMatch[0]); } catch {} 
  }
  
  // Extract first JSON array
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrMatch) { 
    try { return JSON.parse(arrMatch[0]); } catch {} 
  }
  
  return null;
}

// Legacy alias for backward compatibility
export function parseJsonFromAI(text: string): any {
  return parseJsonSafely(text);
}

function getCacheKey(systemPrompt: string, userPrompt: string): string {
  return `${systemPrompt.slice(0, 100)}::${userPrompt.slice(0, 200)}`;
}

function checkChannelConnected(): void {
  if (typeof window !== 'undefined' && !localStorage.getItem('yt_channel_data')) {
    throw new Error("Please connect your channel first.");
  }
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; skipChannelCheck?: boolean }
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.7, skipChannelCheck = false } = options || {};

  // Check channel is connected (unless skipped for landing page)
  if (!skipChannelCheck) {
    checkChannelConnected();
  }

  // Check cache for deduplication
  const cacheKey = getCacheKey(systemPrompt, userPrompt);
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // If we're in cooldown, wait
  const now = Date.now();
  if (cooldownUntil > now) {
    const wait = cooldownUntil - now;
    if (wait > 15000) {
      setStatus("limited");
      throw new Error(`AI is cooling down. Please retry in ${Math.ceil(wait / 1000)}s.`);
    }
    await new Promise(r => setTimeout(r, wait));
  }

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: models[modelIndex],
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature,
          }),
        });

        if (res.status === 429) {
          // Parse retry-after from error body
          try {
            const err = await res.json();
            const match = err.error?.message?.match(/try again in (\d+)m/i);
            if (match) {
              const mins = parseInt(match[1]);
              cooldownUntil = Date.now() + mins * 60 * 1000;
            } else {
              cooldownUntil = Date.now() + 30000;
            }
          } catch {
            cooldownUntil = Date.now() + 30000;
          }
          setStatus("limited");
          // Try next model immediately
          break;
        }

        if (!res.ok) continue;

        const data = await res.json();
        const result = data.choices?.[0]?.message?.content || "";
        
        // Cache successful result
        requestCache.set(cacheKey, { result, timestamp: Date.now() });
        
        setStatus("ok");
        return result;
      } catch (err) {
        if (attempt === 0) await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  setStatus("limited");
  throw new Error("All AI models unavailable. Please try again in 30 seconds.");
}

export async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  checkChannelConnected();

  // Use first available model with streaming
  for (const model of models.slice(0, 3)) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 2000,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (res.status === 429) continue;
      if (!res.ok) continue;

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              onChunk(content);
            }
          } catch { /* partial */ }
        }
      }
      setStatus("ok");
      return full;
    } catch {
      continue;
    }
  }
  setStatus("limited");
  throw new Error("AI streaming unavailable. Please try again shortly.");
}
