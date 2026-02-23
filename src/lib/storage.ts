/**
 * Cloudflare R2 storage for interview recordings and transcripts.
 *
 * Uses aws4fetch (Cloudflare-recommended) - no AWS SDK. S3-compatible API.
 * Env: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT
 */

import "server-only";
import { AwsClient } from "aws4fetch";

const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, "");
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME ?? "deeppivots";

function getR2Client(): AwsClient {
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be set for storage operations"
    );
  }
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

/**
 * Upload a buffer to R2 and return a presigned URL for fetching (7-day expiry).
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucket = bucketName;
  const objectUrl = `${endpoint}/${bucket}/${key}`;

  const bodyBuffer =
    typeof body === "string" ? Buffer.from(body, "utf-8") : body;

  const res = await client.fetch(objectUrl, {
    method: "PUT",
    body: bodyBuffer as BodyInit,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed: ${res.status} ${text}`);
  }

  // Generate presigned GET URL (7 days)
  const expiresIn = 60 * 60 * 24 * 7;
  const signed = await client.sign(
    new Request(`${objectUrl}?X-Amz-Expires=${expiresIn}`),
    { aws: { signQuery: true } }
  );

  return signed.url.toString();
}
