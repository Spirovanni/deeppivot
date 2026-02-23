# Cloudflare R2 Setup

DeepPivot uses **Cloudflare R2** for file storage (interview recordings, transcripts, avatars). R2 is S3-compatible and has no egress fees.

## 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2 Object Storage** → **Overview** → **Create bucket**
3. Name the bucket (e.g. `deeppivots`)
4. Choose a location or leave default

## 2. Create API Tokens

1. In R2 → **Manage R2 API Tokens** → **Create API token**
2. Permissions: **Object Read & Write**
3. Scope: your bucket (or all buckets)
4. Copy **Access Key ID** and **Secret Access Key**

## 3. Environment Variables

Add to `.env`:

```env
R2_ACCOUNT_ID=your_account_id          # From Cloudflare dashboard URL
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=deeppivots
```

- **R2_ACCOUNT_ID**: Found in the Cloudflare dashboard URL or under **Workers & Pages** → **Overview**
- **R2_ENDPOINT**: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`

## 4. Usage

The app uses `src/lib/storage.ts` with the AWS S3 SDK (`@aws-sdk/client-s3`). Uploads return presigned URLs (7-day expiry) for secure access.

## 5. Public Access (Optional)

For public assets (e.g. avatars), you can enable a custom domain or R2 public bucket. For private content (recordings, transcripts), use presigned URLs only.
