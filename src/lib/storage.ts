/**
 * Cloudflare R2 storage for interview recordings and transcripts.
 *
 * Uses S3-compatible API. Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT
 */

import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME ?? "deeppivots";

function getR2Client(): S3Client {
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be set for storage operations"
    );
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: typeof body === "string" ? Buffer.from(body, "utf-8") : body,
      ContentType: contentType,
    })
  );

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );
  return url;
}
