import assert from "node:assert/strict"
import test from "node:test"
import {
  findExternalExecutableUrls,
  findSensitiveText,
  isAllowedArtifactPath,
  isDocumentationAddress,
  parseFrontmatter,
} from "../scripts/lib.mjs"

test("artifact boundary permits only semantically reviewable files", () => {
  assert.equal(isAllowedArtifactPath("assets/_headers"), true)
  assert.equal(isAllowedArtifactPath("assets/index.html"), true)
  assert.equal(isAllowedArtifactPath("assets/icon.svg"), true)
  assert.equal(isAllowedArtifactPath("assets/font.woff2"), false)
  assert.equal(isAllowedArtifactPath("assets/image.webp"), false)
})

test("frontmatter parser separates metadata from Markdown", () => {
  const parsed = parseFrontmatter(
    "---\ntype: cnix/test\n---\n# Body\n",
    "fixture.md",
  )
  assert.equal(parsed.data.type, "cnix/test")
  assert.equal(parsed.body, "# Body\n")
})

test("guardian detects credential-shaped assignments", () => {
  const candidate = `token = "${"abcdefghijklmnop"}${"qrstuvwxyz123456"}"`
  const findings = findSensitiveText(candidate, "fixture.txt")
  assert.equal(findings.length, 1)
  assert.match(findings[0], /credential assignment/)
})

test("guardian permits documentation addresses and rejects deployment addresses", () => {
  const deploymentAddress = [10, 23, 4, 5].join(".")
  assert.equal(isDocumentationAddress("192.0.2.10"), true)
  assert.equal(isDocumentationAddress("198.51.100.8"), true)
  assert.equal(isDocumentationAddress(deploymentAddress), false)
  assert.equal(findSensitiveText("use 192.0.2.10", "example.md").length, 0)
  assert.equal(
    findSensitiveText(`use ${deploymentAddress}`, "example.md").length,
    1,
  )
  assert.equal(
    findSensitiveText("vector path 0 .138.112.25.25h7.5", "icon.js").length,
    0,
  )
})

test("guardian detects private keys", () => {
  const marker = ["-----BEGIN OPENSSH", "PRIVATE KEY-----"].join(" ")
  const findings = findSensitiveText(marker, "fixture.txt")
  assert.equal(findings.length, 1)
})

test("guardian detects high-entropy strings without a credential label", () => {
  const candidate = ["f9QaZ2vLm7", "P4xNc8RkW1", "tY6uHs3Ed0", "Bg5J"].join("")
  const findings = findSensitiveText(candidate, "fixture.txt")
  assert.equal(findings.length, 1)
  assert.match(findings[0], /high-entropy/)
})

test("guardian rejects executable third-party URLs and permits XML namespaces", () => {
  assert.equal(
    findExternalExecutableUrls(
      'import("https://cdn.example.test/library.js")',
      "bundle.js",
    ).length,
    1,
  )
  assert.equal(
    findExternalExecutableUrls(
      'createElementNS("http://www.w3.org/2000/svg", "svg")',
      "bundle.js",
    ).length,
    0,
  )
})
