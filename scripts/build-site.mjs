import { spawn } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const projection = await mkdtemp(path.join(tmpdir(), "cnix-public-projection-"))
const serve = process.argv.includes("--serve")

function run(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      stdio: "inherit",
    })
    child.on("error", reject)
    child.on("exit", (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} exited with ${code ?? signal}`))
    })
  })
}

try {
  await run("scripts/project-public.mjs", [projection])
  await run("scripts/prepare-renderer.mjs")
  const buildArguments = [
    "build",
    "--directory",
    projection,
    "--output",
    "public",
  ]
  if (serve) buildArguments.push("--serve")
  await run("quartz/bootstrap-cli.mjs", buildArguments)
  if (!serve) {
    await run("scripts/enrich-artifact.mjs", ["public"])
    await run("scripts/guardian.mjs", ["artifact", "public", projection])
  }
} finally {
  await rm(projection, { recursive: true, force: true })
}
