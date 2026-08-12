---
type: cnix/system
title: Project showcases
description:
  Distinct marketing sites generated from each reviewed cnix project concept.
resource: https://github.com/julian-corbet/cnix-corbet-ch
tags: [cnix, showcases, marketing, publishing]
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

## Two pages, two jobs

Every documented project has two deliberately different public views:

- A project's `nix*.corbet.ch` host is a concise, visual landing page. It leads
  with the problem, promise, demonstration, evidence, and a useful next action.
- Its `cnix.corbet.ch/projects/{project-id}` page is the technical reference. It
  explains what the project is, how it works, how to configure it, and what has
  been verified.

The landing page markets the project; the cnix page documents it. They must not
become duplicate pages competing for the same search intent or canonical URL.

## One reviewed project concept

Both views are compiled from the same reviewed public project concept. The
concept records the stable `cnix_id`, revision-addressed evidence, maturity,
showcase hostname, tagline, intended audience, visual accent, and a small set of
related project IDs.

The showcase generator may change presentation and emphasis. It must not invent
capabilities, maturity, compatibility, evidence, or customer claims.
Hand-maintained copies of those facts are not authoritative.

## Generated showcase artifact

One deterministic build emits a separate artifact directory and host entry for
each project. A host-aware publisher can serve the distinct `nix*.corbet.ch`
domains without duplicating one deployment definition per repository.

Each artifact includes its own canonical metadata, structured software data,
sitemap, robots policy, and `llms.txt`. Styles, scripts, fonts, and generated
art must be packaged locally with the artifact; a different Corbet hostname is
still an external runtime dependency.

## Navigation into the cosmos

Every showcase offers five clear paths:

1. use the project through its installation or tutorial path;
2. understand it through the cnix technical reference;
3. inspect or improve it in its public source repository;
4. explore a few related projects and the searchable full suite index; and
5. discover the wider work at `corbet.ch`.

A hand-copied dropdown containing every project does not scale. Showcase pages
link only a few relevant neighbours and delegate complete discovery to cnix.

## Design and safety

Showcases share a recognisable family system while retaining individual colour,
copy, and composition. This creates a coherent product cosmos without making the
landing pages interchangeable.

The complete showcase artifact passes the same deterministic guardian and
independent adversarial release review as the cnix site. Screenshots remain
disabled until the safe screenshot pipeline is complete. Fixed, generated SVG
motifs may be used when they contain no source or environment data.

## Migration rule

Existing hand-authored `nix*.corbet.ch` sites are migration evidence, not the
source of truth. Useful unique copy is reconciled against the current public
repository before it enters a project concept. The generated landing page
replaces the old root only after review; an old `/docs` page redirects to the
cnix technical reference only after its useful content has been reconciled.

## Related

- [cnix](cnix.md)
- [Knowledge model](knowledge-model.md)
- [Publication guardian](publication-guardian.md)
