# cnix agent guide

The canonical authored website corpus is `knowledge/`. Read its `index.md`
before following links to narrower concepts. Generated directories are never
sources of truth.

## Invariants

- Treat all repository content as public.
- Use revision-addressed public evidence.
- Create tutorials from invented values; never transform private configuration.
- Never give Quartz, Cloudflare, or a reviewer access to a private workspace.
- Deploy only through `npm run deploy`; it binds a read-only adversarial verdict
  to the exact artifact hash before invoking Cloudflare.
- Fix straightforward failures; record complex findings in `TODO.md` with a
  reproducible acceptance condition.

## Commands

- `npm run check` validates source, tests, builds the site, and inspects the
  artifact.
- `npm run dev` serves an explicitly projected public corpus locally.
- `npm run deploy` checks, independently reviews, and deploys an unchanged
  artifact; a dirty tree, rejection, uncertainty, or drift fails closed.
- `npm run format` applies the repository formatter.

Changes to the projection, guardian, schemas, workflows, dependencies, raw HTML
policy, or media policy alter the publication boundary and require
security-focused review.
