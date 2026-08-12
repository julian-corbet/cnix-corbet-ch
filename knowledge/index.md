---
okf_version: "0.2"
---

# cnix — Corbet Nix

cnix is the public knowledge layer for a family of Nix projects. It turns
revision-addressed source evidence into concise explanations, safe tutorials,
and a website that humans and machines can navigate without proprietary tools.

## Working preview

This site is live while its project catalogue is being populated. The current
pages document cnix itself, including the knowledge model and publication
boundary; they are the first end-to-end proof of the system they describe.

## Start here

- [The cnix system](system/cnix.md) — what the product does and why it exists.
- [Knowledge model](system/knowledge-model.md) — concepts, sources, spheres, and
  the private overlay.
- [Publication guardian](system/publication-guardian.md) — why publication is a
  security decision rather than a rendering option.
- [Project showcases](system/project-showcases.md) — how each project gets a
  distinct marketing site without duplicating technical facts.
- [Interoperability](system/interoperability.md) — how cnix plays with OKF, LLM
  Wiki, Obsidian, Quartz, and future nixea views.
- [Operations](system/operations.md) — the unattended maintenance loop and
  last-known-good behaviour.

## Projects

- [Project index](projects/) — concise public explanations of the Corbet Nix
  suite and the route into its individual showcases. The catalogue is being
  populated from revision-addressed repositories.

## Change history

- [Knowledge log](log.md) — chronological changes to this bundle.

## Machine access

The published site also exposes `/knowledge.json`, `/llms.txt`, `/sitemap.xml`,
`/index.xml`, and Quartz's `/static/contentIndex.json`. Markdown remains the
canonical knowledge; every other representation is a rebuildable projection.
