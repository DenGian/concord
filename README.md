# Concord

[![CI](https://github.com/DenGian/concord/actions/workflows/ci.yml/badge.svg)](https://github.com/DenGian/concord/actions/workflows/ci.yml)

Concord is a full-stack real-time community platform built with Next.js, TypeScript and PostgreSQL, featuring role-based servers, private messaging, file sharing and optional audio/video communication.

> An independent real-time community platform inspired by Discord. Concord is not affiliated with or endorsed by Discord Inc.

## Why this project exists

Concord explores the engineering concerns behind a modern communication application: authenticated server/client boundaries, relational data modelling, authorization close to the data layer, paginated chat history and real-time delivery without a custom WebSocket server.

## Core capabilities

- Clerk authentication with application-owned user profiles
- Communities with invite links and admin, moderator and guest roles
- Text, audio and video channels
- Channel and one-to-one messaging delivered in real time over Server-Sent Events (SSE)
- Cursor-paginated message history with editing and soft deletion
- Image and PDF attachments through UploadThing
- Optional LiveKit audio/video rooms and one-to-one calls
- Responsive navigation, mobile layouts and light/dark themes

## Architecture and engineering decisions

- **Next.js App Router:** server components load protected application data; route handlers own mutations, pagination, real-time streams and third-party token creation.
- **Authentication and authorization:** Clerk establishes identity. Route handlers repeat membership, role, channel and conversation checks at the database boundary instead of trusting client-supplied identifiers.
- **PostgreSQL and Prisma:** the relational schema models profiles, communities, memberships, channels, conversations and messages. Unique constraints protect membership and canonical one-to-one conversation pairs.
- **Real-time chat:** mutation routes publish to an in-process event hub and browsers subscribe through SSE. TanStack Query owns paginated history and falls back to polling while the stream is disconnected.
- **Message history:** cursor pagination keeps history requests bounded. Soft deletion preserves message chronology while clearing attachment metadata.
- **Uploads and media:** UploadThing accepts authenticated image/PDF uploads; persisted attachment URLs and MIME types are validated. LiveKit integration is optional and its token endpoint verifies room access before granting a token.
- **Shared validation:** Zod schemas are used by client forms and server route handlers. Public profile projections prevent account identifiers and email addresses from being serialized to other members.

The SSE hub intentionally lives in process memory. It is suitable for local development and a single persistent Node.js instance. Multi-instance or serverless deployment requires a shared broker such as Redis pub/sub behind the same publish/subscribe boundary.

## Tech stack

| Area | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, Radix UI |
| Authentication | Clerk |
| Data | PostgreSQL 17, Prisma 7 |
| Real time | Server-Sent Events, TanStack Query |
| Uploads | UploadThing |
| Audio/video | LiveKit (optional) |
| Quality | ESLint, Vitest, GitHub Actions |

## Local development

### Prerequisites

- Node.js 20.9 or newer
- Docker with Docker Compose, or an existing PostgreSQL database
- Clerk and UploadThing accounts
- A LiveKit project only when testing audio/video features

### Setup

1. Clone the repository and install the locked dependencies.

   ```bash
   git clone https://github.com/DenGian/concord.git
   cd concord
   npm ci
   ```

2. Create the local environment file and add your Clerk and UploadThing credentials.

   ```bash
   cp .env.example .env
   ```

   The Clerk route values and local `DATABASE_URL` in the template work as provided. Add the three LiveKit variables only to enable audio/video.

3. Start PostgreSQL and apply the committed migrations.

   ```bash
   npm run db:up
   npm run db:migrate
   ```

   When using an existing PostgreSQL instance, update `DATABASE_URL` and run only `npm run db:migrate`.

4. Start Concord at [http://localhost:3000](http://localhost:3000).

   ```bash
   npm run dev
   ```

The first signed-in user is prompted to create a community. Invite a second account to exercise membership roles and direct messaging.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk browser key |
| `CLERK_SECRET_KEY` | Yes | Clerk server key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in route (`/sign-in` locally) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up route (`/sign-up` locally) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | Post-sign-in fallback (`/` locally) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Post-sign-up fallback (`/` locally) |
| `UPLOADTHING_TOKEN` | Yes | UploadThing API token |
| `LIVEKIT_API_KEY` | No | LiveKit server API key |
| `LIVEKIT_API_SECRET` | No | LiveKit server API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | No | Public LiveKit WebSocket URL |

Never commit `.env`; local environment files and generated Prisma code are ignored.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Build and run the production bundle |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting files |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:up` / `npm run db:down` | Start or stop local PostgreSQL |
| `npm run db:migrate` | Create and apply development migrations |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:studio` | Open Prisma Studio |

## Quality practices

The repository uses strict TypeScript, ESLint, shared Zod validation, focused unit tests for validation, permissions, conversation creation and real-time event delivery, plus CI checks for dependency installation, production dependency auditing, linting, type-checking, tests and a production build.

## Known limitations

- The in-process SSE hub assumes one persistent Node.js application instance; horizontal scaling requires a shared event broker.
- LiveKit is optional and audio/video features are unavailable without its three environment variables.
- Request rate limiting and automated cleanup of replaced or deleted UploadThing objects are not implemented. Add both before exposing a public production deployment.
- No production hosting topology is prescribed or documented.

## Security, contributing and license

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Focused issues and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.

Concord is released under the [MIT License](LICENSE).
