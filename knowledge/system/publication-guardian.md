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

## Target release path

The release path below is the required end state. Deployment is disabled while
the independent adversarial gate remains an open critical finding; current CI
stops after producing a checked candidate artifact.

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
       independent adversarial review
                 |
                 v
      Quartz build and artifact checks
                 |
                 v
        immutable Cloudflare release
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

That independent reviewer is deliberately recorded as an
[open critical finding](https://github.com/julian-corbet/cnix-corbet-ch/blob/main/TODO.md#cnix-0001--independent-adversarial-publication-review).
The current implementation must not claim that deterministic checks alone
provide the intended assurance.

## Tutorials

Examples are generated from public schemas and option surfaces using invented
values. Redaction is not an accepted transformation: a redacted private file
preserves structure, correlations, omissions, and mistakes that may disclose the
original deployment.

## Media

Media is denied until the screenshot pipeline can decode and re-encode pixels,
strip metadata, scan OCR text, compare identifiers, conduct independent visual
review, and prove itself with seeded canaries. This is tracked as
[`CNIX-0002`](https://github.com/julian-corbet/cnix-corbet-ch/blob/main/TODO.md#cnix-0002--safe-screenshot-pipeline).
