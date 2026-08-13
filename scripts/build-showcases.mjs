import path from "node:path"
import { fileURLToPath } from "node:url"
import { assembleReleaseBundle } from "./showcase-lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
if (!process.argv[2]) throw new Error("A cnix artifact directory is required")
const cnixArtifact = path.resolve(root, process.argv[2])
const output = path.resolve(root, process.argv[3] ?? "public")
if (output !== path.join(root, "public")) {
  throw new Error(`Refusing to replace an unowned release directory: ${output}`)
}

const { projects, sites } = await assembleReleaseBundle({
  cnixArtifact,
  knowledgeRoot: path.join(root, "knowledge"),
  output,
})

console.log(
  `Built ${sites.length} host artifact(s), including ${projects.length} project showcase(s)`,
)
