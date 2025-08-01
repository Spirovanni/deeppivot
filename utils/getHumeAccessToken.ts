import 'server-only';

import { fetchAccessToken } from "hume";

export const getHumeAccessToken = async () => {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID;

  console.log('Environment check:', {
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    hasConfigId: !!configId,
    apiKeyLength: apiKey?.length,
    secretKeyLength: secretKey?.length,
    configId: configId
  });

  if (!apiKey || !secretKey || !configId) {
    const missing = [];
    if (!apiKey) missing.push('HUME_API_KEY');
    if (!secretKey) missing.push('HUME_SECRET_KEY');
    if (!configId) missing.push('NEXT_PUBLIC_HUME_CONFIG_ID');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
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
