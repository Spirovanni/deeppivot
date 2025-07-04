import 'server-only';

import { fetchAccessToken } from "hume";

export const getHumeAccessToken = async () => {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID;

  if (!apiKey || !secretKey || !configId) {
    throw new Error('Missing required environment variables (HUME_API_KEY or HUME_SECRET_KEY or NEXT_PUBLIC_HUME_CONFIG_ID)');
  }

  const accessToken = await fetchAccessToken({
    apiKey: String(process.env.HUME_API_KEY),
    secretKey: String(process.env.HUME_SECRET_KEY),

  });

  if (accessToken === "undefined") {
    throw new Error('Unable to get access token');
  }

  return accessToken ?? null;
};
