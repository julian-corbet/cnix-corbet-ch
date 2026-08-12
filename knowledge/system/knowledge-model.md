---
type: cnix/architecture
title: Knowledge model
description:
  The canonical sources, three knowledge spheres, and derived publication views
  used by cnix.
tags: [architecture, obsidian, provenance, spheres]
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
---

## Canonical sources

The Nix repositories are changing sources, so cnix treats source revisions as
immutable evidence rather than pretending that an entire repository never
changes. A concept records the exact public revision from which its claims were
derived. A later revision creates drift to inspect; it does not rewrite history.

Documentation alone cannot proofread implementation. Verification may inspect
public code, module options, tests, examples, and revision history. The private
overlay may additionally compare declared intent with actual configuration, but
private evidence never becomes a public source dependency.

## Three spheres

| Sphere   | Contains                                                                            | Publication rule                                        |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Public   | Summary, definition, mechanism, public configuration guidance, evidence, and limits | Eligible after all gates pass                           |
| Private  | How the deployment is actually configured, private findings, and private work       | Never enters the publisher's input                      |
| Tutorial | Invented examples derived from public options and schemas                           | Published as the safe substitute for real configuration |

The private Obsidian workspace imports the public repository. The dependency is
one-way: private pages may link to public concepts; public concepts never link
to the private repository. Tutorials remain in the public corpus. Their presence
in an Obsidian vault consumes no model tokens; agents load them only when a task
requires them.

## Concept shape

Every public project page follows the same answer-first sequence:

1. Summary
2. What it is
3. How it works
4. How to configure it
5. Tutorial
6. Evidence and limits
7. Related

The source corpus can stay granular for linking and retrieval while the website
presents one coherent page per project. This separates storage granularity from
human reading cost.

## Stable identity

`cnix_id` is the durable join key for a project. Future architecture views,
private configuration pages, findings, GitHub issues, and website routes may
refer to that identifier. A join key is not a shared database: each concern
keeps its own authority.

## Work awareness

cnix may render a private read-only work perspective over the existing Markdown
task queue. It does not copy task state. Directory location remains the task
state, and public work remains in GitHub issues and pull requests.

## Projections

Markdown and YAML frontmatter are canonical. HTML, search indexes, JSON, RSS,
sitemaps, navigation, and `llms.txt` are disposable projections. Deleting and
rebuilding them must never lose knowledge.
