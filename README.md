# Discord Clone

[![CI](https://github.com/DenGian/full-stack_discord_clone/actions/workflows/ci.yml/badge.svg)](https://github.com/DenGian/full-stack_discord_clone/actions/workflows/ci.yml)

A full-stack Discord-inspired community app built with the Next.js App Router. It supports server administration, role-based channels, realtime chat, private messages, file sharing, and optional audio/video rooms in a responsive dark/light interface.

> This is an independent portfolio project. It is not affiliated with or endorsed by Discord Inc.

## Highlights

- Authentication and user profiles powered by Clerk
- Servers with invite links, member management, and admin/moderator/guest roles
- Text, audio, and video channels
- Realtime channel and direct messages over Server-Sent Events (SSE)
- Cursor-paginated message history, editing, soft deletion, and emoji input
- Image and PDF attachments through UploadThing
- LiveKit-powered audio/video rooms and one-to-one calls
- Responsive navigation, mobile sidebars, and theme switching
- Server-side authorization and shared Zod validation on all mutations
- PostgreSQL data model and migrations managed with Prisma
- Unit tests, TypeScript checks, ESLint, and GitHub Actions CI

## Tech stack

| Area | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI |
| Authentication | Clerk |
| Database | PostgreSQL, Prisma 7 |
| Realtime | Server-Sent Events, TanStack Query |
| Uploads | UploadThing |
| Audio/video | LiveKit |
| Testing | Vitest, ESLint, TypeScript |

## Getting started

### Prerequisites

- Node.js 20.9 or newer
- Docker with Docker Compose, or another PostgreSQL instance
- A [Clerk](https://clerk.com/) application
- An [UploadThing](https://uploadthing.com/) application
- A [LiveKit](https://livekit.io/) project only if you want audio/video features

### Installation

1. Clone the repository and install dependencies.

   ```bash
   git clone git@github.com:DenGian/full-stack_discord_clone.git
   cd full-stack_discord_clone
   npm install
   ```

2. Create a local environment file.

   ```bash
   cp .env.example .env
   ```

3. Add your Clerk and UploadThing credentials to `.env`. Add the three LiveKit values if you want audio/video rooms. The sample already contains the routing values and local database URL.

4. Start PostgreSQL and apply the migrations.

   ```bash
   npm run db:up
   npm run db:migrate
   ```

5. Start the app and open [http://localhost:3000](http://localhost:3000).

   ```bash
   npm run dev
   ```

The first signed-in user can create a server from the setup screen. Share its generated invite link to add another account and exercise member management or direct messaging.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk browser key |
| `CLERK_SECRET_KEY` | Yes | Clerk server key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in route; `/sign-in` locally |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up route; `/sign-up` locally |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | Post-sign-in fallback; `/` locally |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Post-sign-up fallback; `/` locally |
| `UPLOADTHING_TOKEN` | Yes | UploadThing API token |
| `LIVEKIT_API_KEY` | No | LiveKit server API key |
| `LIVEKIT_API_SECRET` | No | LiveKit server API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | No | Public LiveKit WebSocket URL |

Never commit `.env`; local environment files and generated Prisma code are ignored. Use `.env.example` only as a key-name reference.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting files |
| `npm test` | Run the unit test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:up` / `db:down` | Start or stop local PostgreSQL |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create/apply development migrations |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:studio` | Open Prisma Studio |

## Architecture notes

- Route handlers under `app/api` authenticate with Clerk and repeat authorization at the database boundary.
- Channel membership and conversation participation are checked before returning history, opening an SSE stream, or minting a LiveKit token.
- Realtime events use an in-process SSE hub. This is intentionally simple and works for local development or a single long-running Node.js instance. A multi-instance/serverless deployment should replace `lib/realtime.ts` with a shared broker such as Redis pub/sub.
- Uploaded URLs are restricted to UploadThing hosts and supported image/PDF MIME types before persistence.
- Messages are soft-deleted to keep conversation chronology intact.

## Deployment

Run `npm run db:deploy` against a managed PostgreSQL database, configure the environment variables on your host, and deploy with a persistent Node.js runtime. LiveKit is optional; the UI displays a configuration notice when its credentials are absent.

For horizontally scaled or serverless production hosting, connect the realtime publish/subscribe interface to a shared broker first so events reach clients connected to different instances.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not include credentials or personal data in a public issue.

## License

Released under the [MIT License](LICENSE).
