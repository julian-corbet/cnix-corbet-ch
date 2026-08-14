import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import {
  attestationEnvelope,
  reviewerConfiguration,
  reviewArtifact,
} from "./release-lib.mjs"

if (process.argv.length !== 4) {
  throw new Error(
    "usage: review-artifact.mjs ARTIFACT_DIRECTORY ATTESTATION_FILE",
  )
}

const artifact = path.resolve(process.argv[2])
const output = path.resolve(process.argv[3])
const reviewer = reviewerConfiguration()

async function writeEnvelope(attestation) {
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(
    output,
    `${JSON.stringify(attestationEnvelope(attestation, reviewer), null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  )
}

try {
  const { attestation, inventory } = await reviewArtifact(artifact)
  await writeEnvelope(attestation)
  console.log(`Adversarial reviewer accepted artifact ${inventory.sha256}`)
} catch (error) {
  const attestation = error.attestation
  const terminalRejection =
    attestation?.schema_version === 1 &&
    attestation.artifact_sha256 === error.artifactSha256 &&
    (attestation.verdict === "deny" ||
      attestation.verdict === "uncertain" ||
      (Array.isArray(attestation.findings) && attestation.findings.length > 0))
  if (terminalRejection) {
    await writeEnvelope(attestation)
    console.error(`Artifact reviewer rejected publication: ${error.message}`)
    process.exitCode = 10
  } else {
    throw error
  }
}
