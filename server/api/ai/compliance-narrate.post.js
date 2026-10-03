import { isAiConfigured, askClaude } from "../../utils/anthropic";

/**
 * Turns the triggered compliance-rule results into one short plain-language
 * paragraph. The rules themselves (section, severity, message) are already
 * final and data-driven — this endpoint only narrates them, it never
 * invents or waives a rule.
 * Body: { resolutionTitle, results: [{title, section, severity, message, recommendation}] }
 * Falls back to a formatted bullet list of the rules' own message/recommendation.
 */
export default defineEventHandler(async (event) => {
  const { resolutionTitle, results = [] } = await readBody(event);

  const fallback = {
    narration: results
      .map((r) => `${r.severity.toUpperCase()} — ${r.title} (${r.section}): ${r.message} ${r.recommendation}`)
      .join("\n"),
    aiUsed: false,
  };

  if (!results.length) return { narration: "", aiUsed: false };

  const config = serverConfig(event);
  if (!isAiConfigured(config)) return fallback;

  try {
    const text = await askClaude(config, {
      system:
        "You summarise compliance-check results for a company-secretarial professional in 2-4 short sentences of plain English. " +
        "You MUST NOT drop, soften, or add any compliance point beyond what's given. " +
        "You MUST NOT state anything is compliant or resolved unless the input says so. " +
        "Keep section/rule references intact. No greeting, no sign-off, just the summary.",
      prompt: `Resolution: ${resolutionTitle}\n\nTriggered checks:\n${JSON.stringify(results, null, 2)}`,
      maxTokens: 300,
    });
    return text ? { narration: text, aiUsed: true } : fallback;
  } catch (error) {
    console.error("[ai/compliance-narrate] failed, falling back:", error.message);
    return fallback;
  }
});
