---
type: cnix/project
title: "nixram"
description:
  "nixram is a pre-alpha Nix flake that brings swap, memory-pressure, and
  related kernel policy into one reviewable configuration surface."
cnix_id: nixram
resource: https://github.com/julian-corbet/nixram-corbet-ch
tags: [nix, corbet-nix]
status: draft
stale_after: 2027-02-08
showcase:
  hostname: nixram.corbet.ch
  tagline:
    "Review related Linux memory-policy choices through one declared Nix
    interface."
  audience:
    "Platform teams and experienced FOSS engineers evaluating declarative memory
    policy for Nix-managed Linux systems."
  accent: "#0f766e"
  publish: false
  composition: system
  problem:
    "Swap, out-of-memory policy, and kernel memory settings are often maintained
    separately. nixram explores whether a shared RAM-level model can make those
    choices easier to inspect together."
  demonstration:
    - title: "Choose an explicit level"
      description:
        "The flake includes a helper that proposes a level for an operator to
        review and commit; module evaluation does not probe live hardware."
    - title: "Select the policy mode"
      description:
        "The NixOS module exposes zram, zswap, and no-swap-medium modes, with
        assertions for incompatible configurations."
    - title: "Inspect the resulting surface"
      description:
        "The source keeps its level data, module options, assertions,
        documentation, and declared checks in the same public revision."
  highlights:
    - title: "One policy vocabulary"
      description:
        "A common level table feeds the project's swap, systemd-oomd, and sysctl
        policy surfaces."
    - title: "Several Nix entry points"
      description:
        "The flake exports NixOS, system-manager, and Home Manager modules,
        although their responsibilities are deliberately not identical."
    - title: "Limits remain visible"
      description:
        "This page describes source structure, not a measured performance result
        or proof that every declared check passed."
  evidence:
    "The referenced revision establishes the public source structure and
    declared interfaces. CNIX has not independently reproduced its evaluation,
    tests, deployment, or runtime behaviour."
  related_projects: []
sources:
  - id: repository
    resource: https://github.com/julian-corbet/nixram-corbet-ch/tree/ab433d8475105c350086af1d18f7c3b845078c5f
    title: Revision-addressed public source
    author: team:project-maintainers
cnix:
  nixea_id: nixram
  maturity: pre-alpha
  dogfooded: false
---

## Summary

nixram is an early-stage attempt to describe related Linux memory-policy choices
through one Nix interface. It connects an explicit RAM level with zram or zswap
policy, systemd-oomd settings, and selected kernel controls.

The proposition is modest: make the policy easier to inspect and discuss as a
whole. The referenced revision contains substantial implementation,
documentation, and check definitions, but this CNIX pass did not reproduce a
successful build or runtime result.

## What it is

- A Nix flake exporting NixOS, system-manager, and Home Manager modules.
- A shared table of fourteen RAM-level anchors used by the host modules.
- A `detect-level` application that reads the target machine's memory and prints
  a level assignment for an operator to review and commit.
- A public, pre-alpha implementation with detailed rationale and declared
  evaluation and virtual-machine checks.

The three module outputs do not promise identical scope. NixOS carries the full
host-facing interface. The system-manager output targets a narrower non-NixOS
use case, while Home Manager covers selected user-session policy.

## How it works

The operator selects a level explicitly. Host modules read the corresponding
entry from `levels.nix` and use it to derive defaults across their supported
memory-policy surfaces. Hardware detection remains a separate, run-once aid; it
does not introduce live machine state into Nix evaluation.

The NixOS module declares `zram`, `zswap`, and `none` modes. Assertions cover
several invalid combinations, including zswap without a backing swap device. The
repository also contains separate modules for zram, zswap, systemd-oomd, and
sysctls, alongside checks intended to exercise evaluation and selected
virtual-machine behaviour.

Those definitions are inspectable evidence of intent and implementation. They
are not, by themselves, evidence that a particular revision passed in CI or
behaved well on a given workload.

## How to configure it

The documented shape is to import the module for the target environment, enable
nixram, select a level, and then choose the relevant mode and optional policy
surfaces. An adopter should first evaluate the exact source revision, run its
checks, and review the level table against the intended kernel, hardware, and
workload.

System-manager does not support the project's zram backend. Home Manager is a
separate user-session module rather than a substitute for either host module.

## Tutorial

This example is invented to show the interface shape. It is not copied from a
real deployment and has not been validated against the referenced revision.

```nix
# Synthetic example: invented repository and host choices.
{
  inputs.nixram.url = "github:example-org/nixram-demo";

  imports = [ inputs.nixram.nixosModules.nixram ];

  nixram = {
    enable = true;
    level = "4G";
    mode = "zram";
    oomd.enable = true;
    sysctls.enable = true;
  };
}
```

The repository also exposes its detection helper through a flake app:

```bash
# Synthetic example: public placeholder only.
nix run github:example-org/nixram-demo#detect-level
```

Treat its output as a proposal to review and commit, not as an ongoing hardware
probe.

## Evidence and limits

This page is bound to public revision
`ab433d8475105c350086af1d18f7c3b845078c5f`. That tree contains the flake
outputs, `levels.nix`, module implementations, documentation, and declared
checks discussed above.

CNIX has not independently established a successful evaluation, build, boot,
deployment, performance improvement, or workload result for that revision. The
source also contains policy rationale and historical context; this page does not
treat either as measured validation.

## Related

nixram builds on existing Linux and Nix mechanisms rather than replacing them:
zram or zswap, systemd-oomd, kernel sysctls, NixOS modules, system-manager, and
Home Manager. Its relationship to other Corbet Nix projects is currently a
shared design direction, not evidence of runtime integration.
