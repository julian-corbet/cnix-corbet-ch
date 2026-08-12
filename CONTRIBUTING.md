# Contributing to cnix

Corrections and suggestions are welcome. Edit the Markdown under `knowledge/`
and open a pull request. The public repository is the complete input available
to contributors; no private repository is required.

Run `npm ci` and then `npm run check` before submitting. The check validates
frontmatter, schemas, links, Markdown, spelling, formatting, the publication
boundary, the static build, and the emitted artifact.

## Content rules

- Use standard Markdown links rather than Obsidian-only wikilinks.
- Record revision-addressed public sources in frontmatter.
- Use synthetic values in tutorials. Do not redact a real configuration.
- Do not add hostnames, addresses, account identifiers, usernames, filesystem
  layouts, screenshots, logs, credentials, or topology from a real deployment.
- Keep each public project explanation on one concise page.
- Put complex unresolved work in `TODO.md` with evidence and an acceptance
  condition. Fix straightforward lint failures directly.

Changes to workflows, dependencies, schemas, the guardian, raw HTML, or media
need maintainer review because they change the publication trust boundary.
