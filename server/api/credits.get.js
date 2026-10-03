import { requireUser, assertSameUser } from "../utils/auth";

export default defineEventHandler(async (event) => {
  const caller = await requireUser(event);
  const userId = getQuery(event).userId;
  if (!userId) throw createError({ statusCode: 400, statusMessage: "Missing userId" });

  const config = serverConfig(event);
  const dbUrl = config.DB_API_URL || "https://temp.finaceindia.com";
  const headers = {};
  if (config.DIRECTUS_API_TOKEN) headers.Authorization = `Bearer ${config.DIRECTUS_API_TOKEN}`;

  const response = await fetch(`${dbUrl}/items/user/${encodeURIComponent(String(userId))}?fields=id,credits,email,name`, {
    method: "GET",
    headers,
  });
  if (!response.ok) throw createError({ statusCode: 404, statusMessage: "User not found" });

  const data = await response.json();
  assertSameUser(caller, data.data); // only the account owner can read their email/balance
  return {
    success: true,
    user: {
      id: data.data.id,
      name: data.data.name,
      email: data.data.email,
      credits: data.data.credits || 0,
    },
  };
});
