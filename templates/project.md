---
type: cnix/project
title: PROJECT_NAME
description: ONE_SENTENCE_DESCRIPTION
cnix_id: PROJECT_ID
resource: https://github.com/OWNER/REPOSITORY
tags: [nix, corbet-nix]
status: draft
stale_after: YYYY-MM-DD
showcase:
  hostname: PROJECT_ID.corbet.ch
  tagline: SHORT_PUBLIC_PROMISE
  audience: WHO_THIS_HELPS
  accent: "#0f766e"
  publish: false
  composition: signal
  problem: THE_PUBLIC_PROBLEM_THIS_PROJECT_ADDRESSES
  demonstration:
    - title: FIRST_STAGE
      description: EVIDENCE_BOUND_DESCRIPTION
    - title: SECOND_STAGE
      description: EVIDENCE_BOUND_DESCRIPTION
    - title: THIRD_STAGE
      description: EVIDENCE_BOUND_DESCRIPTION
  highlights:
    - title: FIRST_HIGHLIGHT
      description: EVIDENCE_BOUND_DESCRIPTION
    - title: SECOND_HIGHLIGHT
      description: EVIDENCE_BOUND_DESCRIPTION
    - title: THIRD_HIGHLIGHT
      description: EVIDENCE_BOUND_DESCRIPTION
  evidence: CONCISE_PUBLIC_EVIDENCE_AND_LIMITS
  related_projects: []
generated:
  by: human:maintainer
  at: YYYY-MM-DDT00:00:00Z
sources:
  - id: repository
    resource: https://github.com/OWNER/REPOSITORY/tree/COMMIT
    title: Revision-addressed public source
    author: team:project-maintainers
cnix:
  nixea_id: PROJECT_ID
  maturity: pre-alpha
  dogfooded: false
---

## Summary

State the answer first: what the project does, for whom, and why it matters.

## What it is

Define the project precisely. Distinguish it from adjacent members of the cnix
suite.

## How it works

Explain the mechanism and important boundaries. Link to public evidence.

## How to configure it

Document the public option surface and safe configuration process.

## Tutorial

Use invented, recognisably synthetic values. Never redact or transform a real
private configuration into an example.

## Evidence and limits

Say what has been tested, where the evidence lives, and what remains uncertain.

## Related

Link related cnix projects with standard Markdown links.
