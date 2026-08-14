---
type: cnix/security-control
title: Publication guardian
description:
  The fail-closed boundary that prevents private deployment information from
  reaching the cnix website.
tags: [security, publication, privacy, guardian]
status: draft
generated:
  by: human:maintainer
  at: 2026-08-12T00:00:00Z
sources:
  - id: quartz-private
    resource: https://quartz.jzhao.xyz/features/private-pages
    title: Quartz private pages
    author: team:quartz
---

## Security invariant

The renderer and deployment job receive only an allowlisted public projection.
They never receive the mixed private workspace, its Git history, private
repository credentials, or real configuration. Quartz filters are presentation
features, not a security boundary: Quartz documents that non-Markdown assets can
be emitted even when page filters hide notes.[^quartz-private]

[^quartz-private]: Quartz private pages

## Release path

CI stops after producing a checked candidate artifact. An authorized maintainer
can run the complete release path below from a clean source revision.

```text
public Markdown and synthetic tutorials
                 |
                 v
      deterministic source checks
                 |
                 v
       clean allowlisted projection
                 |
                 v
           Quartz build
                 |
                 v
 deterministic artifact checks
                 |
                 v
       independent adversarial review
                 |
                 v
         unchanged static release
```

Every gate fails closed. Failure or uncertainty leaves the last-known-good
deployment untouched and reports one actionable finding.

## Deterministic gates

The implemented guardian rejects:

- symbolic links, unexpected file types, and media;
- missing or malformed frontmatter and project schemas;
- Obsidian-only links in the portable public corpus;
- raw HTML and executable browser constructs in authored Markdown;
- credential-like assignments, private keys, token formats, local filesystem
  paths, non-documentation IP addresses, and suspicious high-entropy values;
- non-synthetic configuration examples;
- external executable resource URLs in generated scripts or styles;
- generated files that do not correspond to the approved projection; and
- source maps, unexpected artifacts, or forbidden strings in built output.

Repository secret scanning remains a separate CI gate because working-tree
checks cannot prove that Git history is clean.

## Adversarial gate

Deterministic patterns cannot understand every semantic disclosure. The final
design therefore requires a strong reviewer, independent from the authoring
model, to inspect the exact candidate artifact and attempt to reconstruct
private topology, identities, deployment values, or operational facts. It must
return a structured verdict; uncertainty blocks publication.

The release command invokes a separately configured strong model with a
read-only sandbox and an isolated temporary working directory. It first places
the complete artifact in a content-addressed Nix store path, which unprivileged
processes cannot change. Worker compilation has already happened before the
artifact guardian runs. A pinned Wrangler dry run with bundling disabled must
reproduce the stored executable byte for byte. The reviewer receives the store
path's complete inventory and every text-bearing byte; invalid UTF-8 is rejected
rather than decoded with replacement characters. The structured verdict must
match the complete artifact hash, state `allow`, report no uncertainty and no
findings, and cover the required disclosure classes. A standalone review may be
retained as workflow evidence, but its file is not accepted as publication
authority. The publisher gives the hosting provider the same immutable assets
and pre-bundled Worker, keeps bundling disabled, and checks the store hash
before and after upload.

The reviewer's explicit public-identifier allowlist is narrow: `corbet.ch`,
`cnix.corbet.ch`, the public cnix repository, and project showcase hostnames
matching `nix[a-z0-9-]+.corbet.ch`. The public relationship between a cnix
technical reference and its distinct project showcase is also intentional. The
name nixea, its stable-ID adjacency, and the cnix repository's own command, CI,
guardian, and release mechanics are public product behaviour. This does not
allow other host patterns, provider account details, credentials, private source
paths, or real configured values.

This model gate complements deterministic checks; it does not replace them.

## Tutorials

Examples are generated from public schemas and option surfaces using invented
values. Redaction is not an accepted transformation: a redacted private file
preserves structure, correlations, omissions, and mistakes that may disclose the
original deployment.

## Media

Media is denied until the screenshot pipeline can decode and re-encode pixels,
strip metadata, scan OCR text, compare identifiers, conduct independent visual
review, and prove itself with seeded canaries.
