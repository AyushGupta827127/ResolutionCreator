import Anthropic from "@anthropic-ai/sdk";

let cachedClient = null;

export function isAiConfigured(config) {
  return Boolean(config.ANTHROPIC_API_KEY) && config.public.AI_ENABLED;
}

function getClient(config) {
  if (!cachedClient) cachedClient = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return cachedClient;
}

/**
 * Every caller of this wraps the result with its own deterministic fallback
 * — the app must keep working end to end with no API key configured, per
 * the "scaffold with placeholders" setup. AI here augments the flow, it
 * never becomes a hard dependency for generating a compliant resolution.
 */
export async function askClaude(config, { system, prompt, maxTokens = 400 }) {
  const anthropic = getClient(config);
  const response = await anthropic.messages.create({
    model: config.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content?.find((c) => c.type === "text");
  return block?.text?.trim() || "";
}
