import { isAiConfigured, askClaude } from "../../utils/anthropic";

/**
 * Answers a free-text question about the section the user is currently
 * filling in — the "Ask anything about this section…" box in the AI
 * Assistant panel. Scoped deliberately narrow: it explains fields and
 * general drafting context, it does not draft resolution text or invent
 * legal advice beyond what the resolution's own help content covers.
 * Body: { resolutionTitle, sectionName, fields: [{label, tooltip}], question }
 */
export default defineEventHandler(async (event) => {
  const { resolutionTitle, sectionName, fields = [], question } = await readBody(event);
  if (!question) throw createError({ statusCode: 400, statusMessage: "Missing question" });

  const config = useRuntimeConfig(event);
  const fallback = {
    answer: "AI help isn't configured for this deployment yet — check the field's info icon for guidance instead.",
    aiUsed: false,
  };
  if (!isAiConfigured(config)) return fallback;

  const fieldList = fields.map((f) => `- ${f.label}${f.tooltip ? `: ${f.tooltip}` : ""}`).join("\n");

  try {
    const text = await askClaude(config, {
      system:
        "You answer a short question from a company-secretarial professional about ONE section of an Indian corporate resolution form they're filling in. " +
        "Answer in 2-4 sentences, plain English. Stay scoped to explaining what the section's fields mean and how to fill them — do not draft resolution clauses, do not give legal advice beyond general procedural guidance, and say so plainly if the question is outside that scope. " +
        "No greeting, no sign-off.",
      prompt: `Resolution: ${resolutionTitle}\nSection: ${sectionName}\n\nFields in this section:\n${fieldList}\n\nQuestion: ${question}`,
      maxTokens: 300,
    });
    return text ? { answer: text, aiUsed: true } : fallback;
  } catch (error) {
    console.error("[ai/section-help] failed, falling back:", error.message);
    return fallback;
  }
});
