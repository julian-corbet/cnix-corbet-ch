---
type: cnix/operations
title: Operations
description: The unattended cnix update, lint, review, and publication loop.
tags: [automation, lint, maintenance, publication]
status: draft
generated:
  by: human:maintainer
  at: 2026-08-12T00:00:00Z
sources:
  - id: repository
    resource: https://github.com/julian-corbet/cnix-corbet-ch
    title: cnix public repository
    author: team:cnix-maintainers
---

## Update loop

```text
source revision changes
        |
        v
mechanical inventory and diff triage
        |
        v
strong-model synthesis with provenance
        |
        v
code, schema, Markdown, link, and safety lint
        |
        v
static build and deterministic artifact review
        |
        v
independent adversarial publication review
        |
        v
deploy the unchanged artifact
```

Cheap models may enumerate files, extract headings, classify diffs, and prepare
candidate lists. They do not decide privacy, architecture, synthesis, or final
quality. Their output is evidence for a stronger author or reviewer.

## Source promotion boundary

This repository is public. A source candidate is therefore published when it is
pushed to Git hosting, before CI runs and before the website release command
reviews the built artifact. A later deletion does not remove it from Git
history.

Internal automated maintenance assembles candidates outside the public working
tree. The source gate exports the exact candidate, inventories every byte,
includes the candidate commit and its public base in an independent structured
review, runs the complete repository check, and pushes only that unchanged
one-commit descendant. It then proceeds through the separate artifact release
gate. Local Git hooks are useful defence in depth but are not the security
boundary: they are not guaranteed to run in every clone.

External pull requests are public proposals by definition. Their authors and
reviewers must not use them to disclose private configuration. Automation may
promote a generated candidate only through the exact source gate; it does not
push a mutable working tree directly.

## Lint policy

Code, documentation, links, frontmatter, schemas, generated projections, and the
final artifact are linted. Straightforward failures are corrected where they
occur. A complicated failure becomes a structured item in `TODO.md` with a
stable ID, severity, evidence, owner, and acceptance condition so a dedicated
agent can begin without rediscovering it.

The TODO list is not a second task manager. Private operational authority stays
in the private Markdown queue; public contribution work stays in GitHub. The
repository TODO is a bounded handoff surface for unresolved cnix findings.

## Publication behaviour

The green path requires no interactive publication decision. `npm run deploy`
requires a clean Git tree and runs the complete check and build. It places the
pre-bundled artifact in the content-addressed, immutable Nix store. A dry run
proves that Wrangler's pinned `--no-bundle` path preserves the executable bytes;
a separately configured strong model then gives the exact artifact a structured
privacy verdict. A review performed by an earlier workflow stage is retained as
evidence but is not a reusable publication credential. The publisher gives the
hosting provider the same store path, disables bundling, and verifies the hash
before and after upload.

A rejection, uncertainty, changed byte, failed check, or provider error stops
the release and keeps the last-known-good website live. The publisher does not
attempt a partial release. The local attestation records the source revision,
reviewer configuration, covered risks, and exact artifact identity.

## Freshness

Each project records revision-addressed sources and, when appropriate, a
`stale_after` date. Source movement, overdue verification, broken links, or a
changed option surface creates review work. Freshness is visible; it is never
silently inferred from a successful build.
