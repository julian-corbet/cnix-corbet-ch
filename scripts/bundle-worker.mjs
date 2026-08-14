import { spawn } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artifact = path.join(root, "public")

function run(command, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    })
    child.on("error", reject)
    child.on("exit", (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with ${code ?? signal}`))
    })
  })
}

const temporary = await mkdtemp(path.join(tmpdir(), "cnix-worker-bundle-"))
try {
  await run("npm", [
    "exec",
    "--",
    "wrangler",
    "deploy",
    "--name",
    "cnix-synthetic-build",
    "--dry-run",
    "--outdir",
    temporary,
    "--config",
    path.join(artifact, "wrangler.json"),
  ])
  const worker = await readFile(path.join(temporary, "index.js"))
  new TextDecoder("utf-8", { fatal: true }).decode(worker)
  await rm(path.join(artifact, "worker"), { recursive: true, force: true })
  await mkdir(path.join(artifact, "worker"), { recursive: true })
  await writeFile(path.join(artifact, "worker", "index.mjs"), worker)
  console.log("Prepared the exact no-bundle Worker upload bytes")
} finally {
  await rm(temporary, { recursive: true, force: true })
}
