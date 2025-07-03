<div align="center">
  <img src="https://storage.googleapis.com/hume-public-logos/hume/hume-banner.png">
  <h1>EVI Next.js App Router Example</h1>
</div>

![preview.png](preview.png)

## Overview

This project features a sample implementation of Hume's [Empathic Voice Interface](https://hume.docs.buildwithfern.com/docs/empathic-voice-interface-evi/overview) using Hume's React SDK. Here, we have a simple EVI that uses the Next.js App Router.

## Project deployment

Click the button below to deploy this example project with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhumeai%2Fhume-evi-next-js-starter&env=HUME_API_KEY,HUME_SECRET_KEY)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
# or
bun run dev

```

## Prisma Database Management

```bash

bunx prisma generate

bunx prisma db push

```

## Task Master Management

```bash

npm install -g task-master-ai

task-master init

task-master parse-prd prd.txt

task-master list


task-master next

task-master generate

Complete Task 1.8 and before you start reference .cursor/task-master.json to know the file structure then after changes that effect the file structure go back to .cursor/task-master.json to make the changes in the file structure that represent the changes you made.

Please mark Task id-2 as complete since we completed all sub-tasks.

```

Below are the steps to completing deployment:

1. Create a Git Repository for your project.
2. Provide the required environment variables. To get your API key and Client Secret key, log into the portal and visit the [API keys page](https://beta.hume.ai/settings/keys).

## Support

If you have questions, require assistance, or wish to engage in discussions pertaining to this starter template, [please reach out to us on Discord](https://link.hume.ai/discord).
