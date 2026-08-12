import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import {
  artifactInventory,
  reviewerPrompt,
  validateAttestation,
} from "../scripts/release-lib.mjs"

test("reviewer policy narrowly allowlists public showcase hostnames", () => {
  const prompt = reviewerPrompt('{"artifact_sha256":"test"}')
  assert.match(prompt, /nix\[a-z0-9-\]\+\.corbet\.ch/)
  assert.match(prompt, /product name nixea/)
  assert.match(prompt, /npm\s+command names/)
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
