# cnix work queue

Straightforward lint failures are fixed where they occur. This file holds work
that needs a dedicated investigation or changes the publication trust boundary.

## CNIX-0001 — Independent adversarial publication review

- Status: done
- Severity: critical
- Owner: agent
- Evidence: `scripts/release-lib.mjs` gives an isolated read-only reviewer every
  text-bearing artifact byte and the complete inventory; `scripts/deploy.mjs`
  verifies its structured verdict and re-hashes before upload.
- Acceptance: A separately configured strong model reviews the exact candidate
  artifact without write access, attempts to infer private deployment facts,
  returns a machine-readable verdict, and uncertainty blocks publication.

## CNIX-0002 — Safe screenshot pipeline

- Status: open
- Severity: high
- Owner: unassigned
- Evidence: The projection currently rejects all media because metadata, OCR,
  visual content, and embedded payloads are not yet attested.
- Acceptance: The gate strips metadata, decodes and re-encodes pixels, performs
  OCR and identifier matching, runs independent visual review, and tests seeded
  canary disclosures before allowing an image into the projection.

## CNIX-0003 — Private overlay assembly

- Status: open
- Severity: medium
- Owner: unassigned
- Evidence: The public repository is ready to be mounted into the private
  Obsidian workspace, but the private parent/submodule layout is not declared.
- Acceptance: The private repository imports this public repository; its vault
  links public project IDs to private configuration pages and the private task
  queue; no dependency points from public to private.

## CNIX-0004 — Source drift ingestion

- Status: open
- Severity: medium
- Owner: unassigned
- Evidence: Project pages do not yet update when a nix repository changes.
- Acceptance: Revision-addressed source changes enqueue incremental extraction,
  strong-model synthesis, deterministic validation, adversarial review, and a
  last-known-good publication decision.

## CNIX-0005 — nixea reciprocal links

- Status: blocked
- Severity: low
- Owner: unassigned
- Evidence: nixea has a design record but no repository or public URL yet.
- Acceptance: cnix and nixea share only stable project IDs and reciprocal URLs;
  neither copies the other's facts or becomes a build dependency.

## CNIX-0006 — Remove inherited Sharp vulnerability

- Status: blocked
- Severity: high
- Owner: unassigned
- Evidence: Quartz 5.0.0 currently resolves Sharp 0.34.5, which is affected by
  `GHSA-f88m-g3jw-g9cj`; npm reports no fixed dependency path. Media and the
  Quartz image plugins are disabled, reducing reachability but not removing it.
- Acceptance: Upgrade or replace the dependency so `npm audit` reports no high
  severity advisory, then remove advisory `1124066` from the audit baseline.

## CNIX-0007 — Replace deprecated secret-scanner runtime

- Status: blocked
- Severity: low
- Owner: unassigned
- Evidence: The pinned Gitleaks action declares Node.js 20; GitHub currently
  forces it onto Node.js 24 and emits a runtime-deprecation warning. The scan
  still succeeds.
- Acceptance: Use a maintained, commit-pinned action or a checksum-pinned
  official CLI scan that covers full history, leaves no report in the source
  tree, and emits no runtime-deprecation warning.

## CNIX-0008 — Generate the complete project showcase cosmos

- Status: open
- Severity: high
- Owner: agent
- Evidence: Existing `nix*.corbet.ch` pages and family navigation are copied by
  hand, while most active public Corbet Nix projects have no advertised
  homepage. That structure has already drifted and cannot scale with the suite.
- Acceptance: Every allowlisted active public Corbet Nix project has a validated
  project concept and distinct generated landing hostname; one host-aware
  publisher emits local assets, canonical SEO and LLM discovery files, related
  project and portfolio links, and reconciled `/docs` redirects, with every
  artifact passing the cnix publication guardian.

## CNIX-0009 — Claim-bound editorial pipeline

- Status: open
- Severity: medium
- Owner: unassigned
- Evidence: The local model trial in `experiments/editorial-model-bakeoff.md`
  found useful voice and adversarial restraint, but also a dropped material
  claim, an echoed instruction, and inconsistent structured output.
- Acceptance: Paragraph-level rewrite candidates receive only approved claim
  IDs; the original and candidate remain paired; deterministic accounting and a
  strong evidence-aware editor reject missing or added claims; model digest,
  prompt version, timings, and verdict are recorded; seeded regressions cover
  instruction echo, claim loss, malformed output, and unsupported maturity;
  publication still requires the separate artifact guardian.
