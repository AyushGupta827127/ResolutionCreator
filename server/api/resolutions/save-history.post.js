import { requireUser, assertSameUser } from "../../utils/auth";

/**
 * Saves a generated resolution to the SAME Directus `history` collection
 * `template` uses, and deducts 1 credit — server-side. The caller must be the
 * signed-in owner of `userId` (Firebase ID token), so one user can't spend
 * another's credits. Body: { userId, title, slug, contentHtml }
 */
const MAX_HTML = 500_000;

export default defineEventHandler(async (event) => {
  const caller = await requireUser(event);
  const { userId, title, slug, contentHtml } = (await readBody(event)) || {};
  if (!userId || !title || !contentHtml) {
    throw createError({ statusCode: 400, statusMessage: "Missing userId, title or contentHtml" });
  }
  if (String(contentHtml).length > MAX_HTML) {
    throw createError({ statusCode: 413, statusMessage: "Document is too large to save." });
  }

  const config = useRuntimeConfig(event);
  const dbUrl = config.DB_API_URL || "https://temp.finaceindia.com";
  const headers = { "Content-Type": "application/json" };
  if (config.DIRECTUS_API_TOKEN) headers.Authorization = `Bearer ${config.DIRECTUS_API_TOKEN}`;

  const userRes = await fetch(`${dbUrl}/items/user/${encodeURIComponent(userId)}?fields=id,credits,email`, { headers });
  if (!userRes.ok) throw createError({ statusCode: 404, statusMessage: "User not found" });
  const userJson = await userRes.json();
  assertSameUser(caller, userJson.data);
  const credits = Number(userJson.data.credits) || 0;

  if (credits < 1) {
    throw createError({ statusCode: 402, statusMessage: "Not enough credits" });
  }

  const historyRes = await fetch(`${dbUrl}/items/history`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      content: contentHtml,
      template_name: `Resolution: ${title}`,
      url: `/r/${slug}`,
      user_id: userId,
    }),
  });
  if (!historyRes.ok) throw createError({ statusCode: 500, statusMessage: "Failed to save history" });
  const historyJson = await historyRes.json();

  const newBalance = credits - 1;
  const patchRes = await fetch(`${dbUrl}/items/user/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ credits: newBalance }),
  });
  if (!patchRes.ok) {
    // Don't leave a saved document that was never charged for.
    await fetch(`${dbUrl}/items/history/${historyJson.data.id}`, { method: "DELETE", headers }).catch(() => {});
    throw createError({ statusCode: 500, statusMessage: "Failed to update credits" });
  }

  return { success: true, historyId: historyJson.data.id, newBalance };
});
