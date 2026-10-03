import { isAiConfigured, askClaude } from "../../utils/anthropic";

/**
 * Opt-in wording polish for the deterministically-generated resolution
 * text. This is never the primary generation path (that's the Handlebars
 * render in /api/resolutions/generate, which cannot hallucinate a fact) —
 * it's a suggestion the professional reviews and can accept or discard,
 * per "Edit before download". Names, numbers, dates and section citations
 * must not change; only grammar/flow/paragraphing may.
 * Body: { resolutionTitle, draftText, style?, instruction? }
 * `style` is one of "formal" | "concise" | "clarity" | "board" (all optional
 * presets); `instruction` is optional free-text on top of/instead of a preset.
 */
const STYLE_PROMPTS = {
  formal: "Make the tone more formal, in keeping with corporate/legal drafting conventions.",
  concise: "Make the wording more concise — remove redundant phrasing without dropping any clause.",
  clarity: "Improve clarity — simplify sentence structure so it's easier to read, without changing meaning.",
  board: "Match standard board-resolution drafting style and cadence.",
};

export default defineEventHandler(async (event) => {
  const { resolutionTitle, draftText, style, instruction } = await readBody(event);
  if (!draftText) throw createError({ statusCode: 400, statusMessage: "Missing draftText" });

  const config = serverConfig(event);
  const fallback = { refinedText: draftText, aiUsed: false };
  if (!isAiConfigured(config)) return fallback;

  const styleInstruction = STYLE_PROMPTS[style] || "";
  const customInstruction = instruction ? String(instruction).slice(0, 500) : "";

  try {
    const text = await askClaude(config, {
      system:
        "You lightly copy-edit an Indian corporate resolution for wording ONLY, per the requested style. " +
        "Absolute constraints: do not change any name, number, date, amount, DIN, CIN, section/rule citation, or the RESOLVED THAT / RESOLVED FURTHER THAT structure. " +
        "Do not add or remove any clause and do not invent any fact. Do not add commentary. Output ONLY the edited resolution text, nothing else. " +
        "If the draft is already clean for the requested style, return it unchanged.",
      prompt: [
        `Resolution: ${resolutionTitle}`,
        styleInstruction && `Requested style: ${styleInstruction}`,
        customInstruction && `Additional instruction: ${customInstruction}`,
        "",
        draftText,
      ]
        .filter(Boolean)
        .join("\n"),
      maxTokens: 900,
    });
    return text ? { refinedText: text, aiUsed: true } : fallback;
  } catch (error) {
    console.error("[ai/refine-draft] failed, falling back:", error.message);
    return fallback;
  }
});
