# cnix agent guide

The canonical authored website corpus is `knowledge/`. Read its `index.md`
before following links to narrower concepts. Generated directories are never
sources of truth.

## Invariants

- Treat all repository content as public.
- Use revision-addressed public evidence.
- Create tutorials from invented values; never transform private configuration.
- Never give Quartz, Cloudflare, or a reviewer access to a private workspace.
- Keep deployment disabled until `CNIX-0001` is fully implemented and verified.
- Fix straightforward failures; record complex findings in `TODO.md` with a
  reproducible acceptance condition.

## Commands

- `npm run check` validates source, tests, builds the site, and inspects the
  artifact.
- `npm run dev` serves an explicitly projected public corpus locally.
- `npm run format` applies the repository formatter.

Changes to the projection, guardian, schemas, workflows, dependencies, raw HTML
policy, or media policy alter the publication boundary and require
security-focused review.
