import { spawn } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  artifactInventory,
  reviewerConfiguration,
  reviewArtifact,
} from "./release-lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artifact = path.join(root, "public")
const releaseDirectory = path.join(root, ".cnix-release")
const reviewer = reviewerConfiguration()

function option(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  const value = process.argv[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a path`)
  }
  return path.resolve(value)
}

const receiptPath = option("--receipt")
const knownArguments = new Set(["--receipt"])
for (let index = 2; index < process.argv.length; index += 1) {
  if (!knownArguments.has(process.argv[index])) {
    throw new Error(`Unknown deploy argument: ${process.argv[index]}`)
  }
  index += 1
}
const workerName = process.env.CNIX_CLOUDFLARE_WORKER_NAME
if (!workerName || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(workerName)) {
  throw new Error(
    "Set CNIX_CLOUDFLARE_WORKER_NAME to the private release target",
  )
}

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
const tree = (
  await run("git", ["rev-parse", "HEAD^{tree}"], { capture: true })
).trim()
const temporary = await mkdtemp(path.join(tmpdir(), "cnix-deploy-root-"))
const deploymentArtifact = (
  await run(
    "nix",
    ["store", "add-path", "--name", "cnix-release-artifact", artifact],
    { capture: true },
  )
).trim()
if (!deploymentArtifact.startsWith("/nix/store/")) {
  throw new Error("Nix did not return an immutable store path")
}
await run("nix-store", [
  "--realise",
  deploymentArtifact,
  "--add-root",
  path.join(temporary, "gc-root"),
])
try {
  const verification = path.join(temporary, "no-bundle-verification")
  await run("npm", [
    "exec",
    "--",
    "wrangler",
    "deploy",
    "--name",
    workerName,
    "--no-bundle",
    "--dry-run",
    "--outdir",
    verification,
    "--config",
    path.join(deploymentArtifact, "wrangler.json"),
  ])
  const preparedWorker = await readFile(
    path.join(deploymentArtifact, "worker", "index.mjs"),
  )
  const verifiedWorker = await readFile(path.join(verification, "index.mjs"))
  if (!preparedWorker.equals(verifiedWorker)) {
    throw new Error("Wrangler no-bundle verification changed the Worker bytes")
  }

  let review
  try {
    review = await reviewArtifact(deploymentArtifact)
  } catch (error) {
    if (error.attestation) {
      await mkdir(releaseDirectory, { recursive: true })
      await writeFile(
        path.join(releaseDirectory, "last-rejection.json"),
        `${JSON.stringify(
          {
            ...error.attestation,
            git_revision: revision,
            reviewer_model: reviewer.model,
            reviewer_effort: reviewer.effort,
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
  const beforeUpload = await artifactInventory(deploymentArtifact)
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
        reviewer_model: reviewer.model,
        reviewer_effort: reviewer.effort,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  )

  console.log(`Adversarial reviewer accepted artifact ${inventory.sha256}`)
  const publicationTag = `cnix-${inventory.sha256.slice(0, 24)}`
  await run("npm", [
    "exec",
    "--",
    "wrangler",
    "deploy",
    "--name",
    workerName,
    "--no-bundle",
    "--config",
    path.join(deploymentArtifact, "wrangler.json"),
    "--tag",
    publicationTag,
  ])
  const afterUpload = await artifactInventory(deploymentArtifact)
  if (afterUpload.sha256 !== inventory.sha256) {
    throw new Error("Immutable release snapshot changed during upload")
  }

  if (receiptPath) {
    await mkdir(path.dirname(receiptPath), { recursive: true })
    await writeFile(
      receiptPath,
      `${JSON.stringify(
        {
          git_revision: revision,
          git_tree: tree,
          artifact_sha256: inventory.sha256,
          publication_ref: `cloudflare-tag:${publicationTag}`,
          reviewer_model: reviewer.model,
          reviewer_effort: reviewer.effort,
        },
        null,
        2,
      )}\n`,
      { flag: "wx", mode: 0o600 },
    )
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
