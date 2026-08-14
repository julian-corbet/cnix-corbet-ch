import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import {
  artifactInventory,
  attestationEnvelope,
  isTextArtifactPath,
  reviewArtifact,
  reviewerConfiguration,
  reviewerPrompt,
  validateAttestation,
} from "../scripts/release-lib.mjs"

test("all release headers reach the semantic reviewer", () => {
  assert.equal(isTextArtifactPath("_headers"), true)
  assert.equal(isTextArtifactPath("assets/_headers"), true)
  assert.equal(isTextArtifactPath("assets/sites/cnix/index.html"), true)
  assert.equal(isTextArtifactPath("assets/icon.webp"), false)
})

test("artifact review rejects non-text bytes before invoking a reviewer", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "cnix-binary-test-"))
  try {
    await writeFile(path.join(directory, "image.webp"), Buffer.from([0, 1, 2]))
    await assert.rejects(reviewArtifact(directory), /non-text review surfaces/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("artifact review rejects lossy UTF-8 before invoking a reviewer", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "cnix-utf8-test-"))
  try {
    await writeFile(
      path.join(directory, "index.html"),
      Buffer.from([0xc3, 0x28]),
    )
    await assert.rejects(
      reviewArtifact(directory),
      /artifact is not valid UTF-8/,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("artifact review has no silent reviewer default", () => {
  assert.throws(() => reviewerConfiguration({}), /Set CNIX_REVIEW_MODEL/)
  assert.deepEqual(
    reviewerConfiguration({
      CNIX_REVIEW_MODEL: "reviewer",
      CNIX_REVIEW_EFFORT: "configured",
    }),
    { model: "reviewer", effort: "configured" },
  )
})

test("reviewer policy narrowly allowlists public showcase hostnames", () => {
  const prompt = reviewerPrompt('{"artifact_sha256":"test"}')
  assert.match(prompt, /nix\[a-z0-9-\]\+\.corbet\.ch/)
  assert.match(prompt, /product name nixea/)
  assert.match(prompt, /npm\s+command names/)
  assert.match(prompt, /literal prefix \/nix\/store/)
  assert.match(prompt, /Do not extend this allowlist/)
  assert.match(prompt, /<candidate-json>/)
})

test("artifact inventory is stable and changes with artifact bytes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "cnix-release-test-"))
  try {
    await writeFile(path.join(directory, "b.txt"), "second\n")
    await writeFile(path.join(directory, "a.txt"), "first\n")

    const first = await artifactInventory(directory)
    const repeated = await artifactInventory(directory)
    assert.equal(first.sha256, repeated.sha256)
    assert.deepEqual(
      first.files.map((file) => file.path),
      ["a.txt", "b.txt"],
    )

    await writeFile(path.join(directory, "a.txt"), "changed\n")
    const changed = await artifactInventory(directory)
    assert.notEqual(first.sha256, changed.sha256)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("attestation accepts only an exact, certain allow verdict", () => {
  const digest = "a".repeat(64)
  const allowed = {
    schema_version: 1,
    artifact_sha256: digest,
    verdict: "allow",
    uncertainty: false,
    summary: "No private deployment information was found.",
    findings: [],
    reviewed_risks: [
      "identities",
      "topology",
      "credentials",
      "filesystem paths",
      "configured values",
    ],
  }

  assert.doesNotThrow(() => validateAttestation(allowed, digest))
  assert.throws(
    () =>
      validateAttestation(
        { ...allowed, artifact_sha256: "b".repeat(64) },
        digest,
      ),
    /artifact hash/,
  )
  assert.throws(
    () =>
      validateAttestation(
        { ...allowed, verdict: "uncertain", uncertainty: true },
        digest,
      ),
    /did not allow/,
  )
  assert.throws(
    () =>
      validateAttestation(
        {
          ...allowed,
          findings: [
            {
              severity: "high",
              path: "index.html",
              evidence: "deployment detail",
              rationale: "reveals private topology",
            },
          ],
        },
        digest,
      ),
    /findings/,
  )
})

test("standalone review envelope records reviewer configuration as evidence", () => {
  const digest = "a".repeat(64)
  const reviewer = { model: "reviewer", effort: "high" }
  const attestation = {
    schema_version: 1,
    artifact_sha256: digest,
    verdict: "allow",
    uncertainty: false,
    summary: "No private deployment information was found.",
    findings: [],
    reviewed_risks: [
      "identities",
      "topology",
      "credentials",
      "filesystem paths",
      "configured values",
    ],
  }
  const envelope = attestationEnvelope(attestation, reviewer)
  assert.deepEqual(envelope, {
    attestation,
    reviewer_model: "reviewer",
    reviewer_effort: "high",
  })
})

test("deploy rejects unsigned cross-process review handoffs", () => {
  const deployment = spawnSync(
    process.execPath,
    [path.resolve("scripts/deploy.mjs"), "--attestation", "review.json"],
    {
      cwd: path.resolve("."),
      encoding: "utf8",
      env: {
        ...process.env,
        CNIX_REVIEW_MODEL: "reviewer",
        CNIX_REVIEW_EFFORT: "high",
        CNIX_CLOUDFLARE_WORKER_NAME: "synthetic-release-target",
      },
    },
  )
  assert.notEqual(deployment.status, 0)
  assert.match(deployment.stderr, /Unknown deploy argument: --attestation/)
})
