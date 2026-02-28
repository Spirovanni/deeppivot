# Contributing to DeepPivot

First off, thank you for considering contributing to DeepPivot! We welcome contributions that align with our mission to empower career pivots.

This document outlines the guidelines and expectations for contributing to this repository.

## Branch Protection and Workflow

We follow a structured Git workflow to ensure code quality and stability.

1.  **Branch from `main`**: All feature branches and bug fixes must originate from the latest `main` branch.
2.  **Descriptive Branch Names**: Use descriptive names for your branches (e.g., `feature/add-avatar-upload`, `fix/login-error`, `docs/update-readme`).
3.  **Pull Requests (PRs)**: All changes must be submitted via a Pull Request against the `main` branch. Direct commits to `main` are restricted.

## Continuous Integration (CI) Requirements

Our CI pipeline (GitHub Actions) automatically runs on every Push and Pull Request to `main`. **For a PR to be merged, all CI checks must be green.**

The CI pipeline includes:
-   **Linting & Type-checking**: Ensures code follows our style guide and has no TypeScript errors.
-   **Database Migration Check**: Verifies that any changes to the Drizzle ORM schema have corresponding generated migration files committed.
-   **Build**: Compiles the Next.js application to ensure it builds successfully in a production-like environment.
-   **E2E Tests**: Playwright tests to verify core functionality (runs on PRs).
-   **Bundle Size Analysis**: Analyzes the Next.js bundle size and posts a summary comment on the PR to help track performance impact.

## Code Review Policy

We maintain a strict code review policy to catch errors and share knowledge.

*   **1-Review Minimum**: Every Pull Request requires at least **one approving review** from a core maintainer before it can be merged.
*   **Resolve All Conversations**: Please ensure all review comments are addressed and conversations are resolved before requesting a merge.

## Database Schema Changes (Drizzle ORM)

DeepPivot uses Drizzle ORM. If your PR includes changes to the database schema (`src/db/schema.ts` or related files), you **must** follow these steps:

1.  Make your schema changes.
2.  Run `pnpm run db:generate` to generate the SQL migration file.
3.  **Commit the generated migration file(s)** located in the `src/db/migrations` directory alongside your code changes.

The CI pipeline includes a `drizzle-kit check` step and will **fail** if it detects schema changes without corresponding committed migrations.

## Getting Started Locally

Please refer to the `README.md` and `SETUP.md` files in the repository root for instructions on setting up your local development environment.

Thank you for contributing!
