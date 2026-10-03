import { isAiConfigured, askClaude } from "../../utils/anthropic";

/**
 * Turns a free-text description into best-guess values for a section's
 * fields — e.g. "incorporated in 2020 in Patna as a private limited
 * company" -> { date_of_incorporation: "2020", registered_office: "Patna",
 * company_type: "Private Limited Company" }.
 *
 * Trust model: this NEVER writes into `answers` directly. It returns
 * suggestions the client shows for review; the user applies them
 * explicitly (see RefineWordingModal's sibling pattern). The model is
 * instructed to leave a field out entirely rather than guess at something
 * the text doesn't support — no field should be invented.
 *
 * Body: { resolutionTitle, sectionName, questions: [{field, label, type}], freeText }
 */
export default defineEventHandler(async (event) => {
  const { resolutionTitle, sectionName, questions = [], freeText } = await readBody(event);
  if (!freeText || !questions.length) {
    throw createError({ statusCode: 400, statusMessage: "Missing freeText or questions" });
  }

  const config = serverConfig(event);
  const fallback = { values: {}, aiUsed: false };
  if (!isAiConfigured(config)) return fallback;

  const fieldList = questions.map((q) => `- ${q.field} (${q.type}): ${q.label}`).join("\n");

  try {
    const text = await askClaude(config, {
      system:
        "You extract structured field values from a professional's free-text description, for an Indian corporate resolution form. " +
        "You are given a list of fields (name, type, label) and a block of free text. " +
        "Output ONLY a single JSON object mapping field-name -> extracted value, nothing else — no markdown fences, no commentary. " +
        "STRICT RULES: only include a field if the text actually supports a value for it — never guess, never invent, never fill in a plausible-sounding default. " +
        "Omit any field the text doesn't clearly address. For date fields, output YYYY-MM-DD if a full date is given, otherwise omit rather than guess a day/month. " +
        "For number fields, output a bare number. Keep text values concise and close to the source wording.",
      prompt: `Resolution: ${resolutionTitle}\nSection: ${sectionName}\n\nFields:\n${fieldList}\n\nFree text:\n${freeText}`,
      maxTokens: 500,
    });

    if (!text) return fallback;

    let values = {};
    try {
      values = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) values = JSON.parse(match[0]);
    }

    // Only pass through fields we actually asked about — never let a
    // hallucinated key slip into the answers object.
    const validFields = new Set(questions.map((q) => q.field));
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => validFields.has(key) && value !== null && value !== "")
    );

    return { values: filtered, aiUsed: true };
  } catch (error) {
    console.error("[ai/extract-fields] failed, falling back:", error.message);
    return fallback;
  }
});
