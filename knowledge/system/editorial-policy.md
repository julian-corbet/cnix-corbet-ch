---
type: cnix/system
title: Editorial policy
description:
  The audience, claim discipline, and review pipeline for public cnix writing.
resource: https://github.com/julian-corbet/cnix-corbet-ch
tags: [cnix, editorial, writing, automation]
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

## Audience and register

cnix writes for technical decision-makers, platform teams, founders, investors,
and experienced open-source contributors. A page should read like the overlap of
a good architecture memo, a restrained product brief, and a well-maintained FOSS
README.

That audience wants to understand the leverage, mechanism, evidence, maturity,
and adoption path. It does not need a tour of every implementation detail, and
it will discount a correct argument if one unsupported claim is mixed into it.

## Writing rules

1. Lead with the decision-relevant point, then show how it works.
2. Separate what exists, what has been verified, what is planned, and what is
   inferred.
3. Let evidence carry the argument. Adjectives do not substitute for proof.
4. State a material limitation or cost once, where it changes the decision.
5. Prefer a short summary and a navigable index to exhaustive prose.
6. Use the vocabulary of the domain, but explain terms that are not useful
   search or architecture concepts.
7. Remove sentences that add neither a fact, a distinction, nor a useful next
   step.

Avoid assistant-like scene-setting, repeated conclusions, inflated certainty,
and stock claims such as "seamless", "production-ready", or "best in class".
Production use, compatibility, performance, customers, and maturity are claims
that require direct evidence.

## One fact base, two public voices

The cnix technical reference optimises for exactness and retrieval. A project
showcase optimises for recognition: the problem, the leverage, a demonstration,
and a credible next action. They may order and compress the same reviewed facts
differently; neither surface may improve the underlying claims.

## Editorial pipeline

```text
revision-addressed evidence
        |
        v
mechanical or cheap-model extraction
        |
        v
candidate outline and draft
        |
        v
local voice and compression pass
        |
        v
claim-diff and strong editorial censor
        |
        v
independent publication guardian
```

A local model is a private drafting instrument, not an authority. Its rewrite
may remove, order, or rephrase supported claims; it may not add one. A stronger
editor checks the result against the evidence and this policy. The publication
guardian remains a separate fail-closed privacy decision over the exact built
artifact.

## Review questions

- Could a sceptical engineer trace every material statement to evidence?
- Can a technical buyer or investor see the leverage without being sold a
  forecast as a fact?
- Does the page reveal enough implementation to earn an open-source
  contributor's trust?
- Is the useful point visible before the reader loses interest?

## Related

- [Project showcases](project-showcases.md)
- [Operations](operations.md)
- [Publication guardian](publication-guardian.md)
