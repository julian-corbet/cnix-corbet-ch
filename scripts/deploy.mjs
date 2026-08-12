import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { artifactInventory, reviewArtifact } from "./release-lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artifact = path.join(root, "public")
const releaseDirectory = path.join(root, ".cnix-release")

function run(command, arguments_, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: root,
      stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
      env: process.env,
    })
    let stdout = ""
    if (options.capture) {
      child.stdout.setEncoding("utf8")
      child.stdout.on("data", (chunk) => {
        stdout += chunk
      })
    }
    child.on("error", reject)
    child.on("exit", (code, signal) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`${command} exited with ${code ?? signal}`))
    })
  })
}

const dirty = await run(
  "git",
  ["status", "--porcelain", "--untracked-files=normal"],
  { capture: true },
)
if (dirty.trim()) {
  throw new Error("Refusing to deploy from a dirty source tree")
}

await run("npm", ["run", "check"])
const revision = (
  await run("git", ["rev-parse", "HEAD"], { capture: true })
).trim()
let review
try {
  review = await reviewArtifact(artifact)
} catch (error) {
  if (error.attestation) {
    await mkdir(releaseDirectory, { recursive: true })
    await writeFile(
      path.join(releaseDirectory, "last-rejection.json"),
      `${JSON.stringify(
        {
          ...error.attestation,
          git_revision: revision,
          reviewer_model: process.env.CNIX_REVIEW_MODEL ?? "gpt-5.5",
          reviewer_effort: process.env.CNIX_REVIEW_EFFORT ?? "xhigh",
        },
        null,
        2,
      )}\n`,
      { mode: 0o600 },
    )
    console.error(
      "Publication rejected; evidence preserved in .cnix-release/last-rejection.json",
    )
  }
  throw error
}
const { attestation, inventory } = review
const beforeUpload = await artifactInventory(artifact)
if (beforeUpload.sha256 !== inventory.sha256) {
  throw new Error("Artifact changed after adversarial review")
}

await mkdir(releaseDirectory, { recursive: true })
await writeFile(
  path.join(releaseDirectory, "last-attestation.json"),
  `${JSON.stringify(
    {
      ...attestation,
      git_revision: revision,
      reviewer_model: process.env.CNIX_REVIEW_MODEL ?? "gpt-5.5",
      reviewer_effort: process.env.CNIX_REVIEW_EFFORT ?? "xhigh",
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
)

console.log(`Adversarial reviewer accepted artifact ${inventory.sha256}`)
await run("npm", ["exec", "--", "wrangler", "deploy"])
