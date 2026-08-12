---
type: cnix/system
title: cnix
description: Corbet Nix knowledge compiler and safe public documentation system.
resource: https://github.com/julian-corbet/cnix-corbet-ch
tags: [cnix, documentation, enterprise-architecture, knowledge]
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

## Summary

cnix—short for **Corbet Nix**—is a knowledge compiler for a suite of Nix
projects. It keeps durable technical memory, explains the projects to potential
users, audits documentation against implementation evidence, and safely emits a
public website from an Obsidian-readable Markdown corpus.

## Why it exists

The suite contains enough applications and modules that discovery becomes a
problem even for its authors. cnix makes the index as valuable as the articles:
it should answer what exists, why it matters, how mature it is, and where to
look next before a reader opens a detailed page.

The same work serves five purposes:

1. Preserve working knowledge for humans and agents.
2. Explore a contemporary, LLM-led form of enterprise architecture.
3. Present reusable mechanisms so others can request or contribute packaging.
4. Reveal cruft, stale claims, edge cases, and implementation defects.
5. Demonstrate the method itself as a public, inspectable product.

## Product boundary

cnix owns authored explanations, public tutorials, provenance, verification,
publication policy, and a read-only view of related work. It does not own the
declared architecture or become a ticket database.

- Nix repositories remain authoritative for implementation and public options.
- A private parent workspace remains authoritative for real configuration and
  private tasks.
- GitHub issues and pull requests remain authoritative for public contribution
  work.
- A future nixea product may derive architecture directly from Nix source. cnix
  and nixea will share stable project identifiers and links, not copied facts or
  build dependencies.

## What success looks like

A person can understand a project from one concise page. An agent can discover
the same corpus through indexes, structured frontmatter, standard links, raw
Markdown, JSON, RSS, a sitemap, and `llms.txt`. A failed or uncertain safety
check publishes nothing and leaves the last-known-good site online.

## Related

- [Knowledge model](knowledge-model.md)
- [Publication guardian](publication-guardian.md)
- [Operations](operations.md)
