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
independent adversarial publication review
        |
        v
static build, artifact review, and deploy
```

Cheap models may enumerate files, extract headings, classify diffs, and prepare
candidate lists. They do not decide privacy, architecture, synthesis, or final
quality. Their output is evidence for a stronger author or reviewer.

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

The target green path requires no human interaction. Until the independent
adversarial gate is implemented, cnix can build candidate artifacts but cannot
deploy them. Once enabled, a failed gate stops before deployment, keeps the
last-known-good website live, and produces one concise explanation of the
blocking evidence. The publisher does not attempt a partial release.

## Freshness

Each project records revision-addressed sources and, when appropriate, a
`stale_after` date. Source movement, overdue verification, broken links, or a
changed option surface creates review work. Freshness is visible; it is never
silently inferred from a successful build.
