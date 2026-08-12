---
type: cnix/reference
title: Interoperability
description:
  How cnix remains useful in Obsidian, OKF tools, LLM Wiki workflows, ordinary
  Git, and the open web.
tags: [okf, llm-wiki, obsidian, quartz, interoperability]
status: draft
generated:
  by: human:maintainer
  at: 2026-08-12T00:00:00Z
sources:
  - id: okf
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: Open Knowledge Format 0.2
    author: team:google-cloud
  - id: llm-wiki
    resource: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
    title: LLM Wiki
    author: human:andrej-karpathy
  - id: quartz
    resource: https://quartz.jzhao.xyz/
    title: Quartz 5
    author: team:quartz
---

## Open Knowledge Format

The `knowledge/` directory is an OKF 0.2 bundle:

- Markdown concepts carry YAML frontmatter and a required `type`.
- `index.md` files support progressive disclosure.
- `log.md` records chronological updates.
- Standard Markdown links form the portable knowledge graph.
- `sources`, `generated`, `verified`, `status`, and `stale_after` express
  provenance, trust, lifecycle, and freshness when known.

cnix adds domain fields such as `cnix_id`; OKF explicitly permits extensions and
requires consumers to tolerate unknown fields.

## LLM Wiki

cnix adopts the LLM Wiki operating model: revision-addressed raw evidence feeds
an LLM-maintained, interlinked Markdown corpus governed by explicit rules. The
root index is the content map, the log is chronological memory, and lint checks
the corpus as if it were code.

The important adaptation is publication safety. The LLM-owned corpus is not
automatically the public artifact; it must cross a separate guardian boundary.

## Obsidian

Obsidian is the human workbench rather than a storage service. Files remain
ordinary Markdown in Git. cnix uses standard Markdown links because both
Obsidian and OKF understand them; consumers do not need an Obsidian parser.

The private workspace can mount this public repository inside its vault and add
private configuration pages beside it. The public repository remains
independently cloneable and buildable.

## Website and machine views

Quartz turns the clean projection into semantic static HTML with search,
backlinks, indexed navigation, RSS, and a sitemap. cnix additionally emits raw
machine indexes. Traditional SEO and generative-engine discoverability use the
same foundation: direct answers, stable URLs and headings, text-visible claims,
public evidence, current verification dates, and honest limits.

## nixea adjacency

A future nixea product will derive architecture directly from Nix source. cnix
will explain those objects; nixea will show what the source declares and how it
connects. Stable IDs and reciprocal URLs are the entire integration contract.
