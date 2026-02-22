# Hume AI Protocol Compliance

This project integrates with [Hume AI](https://dev.hume.ai/intro) for:

- **EVI (Empathic Voice Interface)** — Real-time voice interviews via `@humeai/voice-react` and `hume` SDK
- **Expression Measurement** — Batch prosody analysis for post-interview emotion feedback

## Protocol Reference

- **Intro & APIs**: https://dev.hume.ai/intro
- **EVI (Speech-to-Speech)**: https://dev.hume.ai/docs/speech-to-speech-evi/overview
- **Authentication**: https://dev.hume.ai/docs/introduction/api-key
- **Expression Measurement**: https://dev.hume.ai/docs/expression-measurement/overview

## Authentication

- **Token auth** (EVI client): `fetchAccessToken({ apiKey, secretKey })` — tokens expire after 30 minutes
- **API key** (server-side REST): `X-Hume-Api-Key` header for Expression Measurement batch/stream

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `HUME_API_KEY` | API key from [app.hume.ai/keys](https://app.hume.ai/keys) |
| `HUME_SECRET_KEY` | Secret key for token generation |
| `NEXT_PUBLIC_HUME_CONFIG_ID` | EVI config ID for voice/behavior |

## SDK Versions

- `hume` ^0.15.0 — TypeScript SDK (EVI, Expression Measurement, TTS)
- `@humeai/voice-react` ^0.2.0 — React SDK for EVI WebSocket + audio
