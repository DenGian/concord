# Contributing

Thank you for considering a contribution to Concord. Bug reports,
documentation improvements, tests, and focused code changes are welcome.

## Before you start

- Search the existing issues and pull requests to avoid duplicate work.
- Open an issue before proposing a large behavioral or architectural change.
- Report security concerns privately by following [SECURITY.md](SECURITY.md).
- Keep changes focused; unrelated refactors should be submitted separately.

## Local development

1. Fork and clone the repository.
2. Install the locked dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and provide the required credentials.
4. Start PostgreSQL with `npm run db:up` and apply migrations with
   `npm run db:migrate`.
5. Start the development server with `npm run dev`.

The complete environment-variable reference and alternative database setup are
documented in [README.md](README.md#getting-started).

## Quality checks

Run the same checks used by continuous integration before opening a pull
request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Add or update tests for changed behavior. Never commit local environment files,
service credentials, generated build output, or generated Prisma client files.

## Commit and pull request guidance

- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
  subjects, for example `fix(chat): reject invalid attachment metadata`.
- Write imperative, concise subjects and include a scope when it adds context.
- Explain the motivation and user-visible effect in the pull request body.
- Link related issues and include screenshots for interface changes.
- Confirm that the quality checks pass and call out any follow-up work.

By contributing, you agree that your contribution is licensed under the
[MIT License](LICENSE).
