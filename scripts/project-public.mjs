import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseFrontmatter, sha256, walkFiles } from "./lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const knowledgeRoot = path.join(root, "knowledge")
const staticRoot = path.join(root, "site", "static")
const output = path.resolve(root, process.argv[2] ?? ".cnix-projection")
const defaultOutput = path.join(root, ".cnix-projection")
const isOwnedTemporaryOutput =
  path.dirname(output) === path.resolve(tmpdir()) &&
  path.basename(output).startsWith("cnix-public-projection-")
if (output !== defaultOutput && !isOwnedTemporaryOutput) {
  throw new Error(
    `Refusing to replace an unowned projection directory: ${output}`,
  )
}

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })

const knowledgeFiles = await walkFiles(knowledgeRoot)
for (const file of knowledgeFiles) {
  if (file.kind !== "file" || !file.relative.endsWith(".md")) {
    throw new Error(
      `Projection rejected unexpected knowledge entry: ${file.relative}`,
    )
  }
  const destination = path.join(output, file.relative)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(file.path, destination)
}

const staticFiles = await walkFiles(staticRoot)
const allowedStatic = new Set(["_headers", "icon.svg", "robots.txt"])
for (const file of staticFiles) {
  if (file.kind !== "file" || !allowedStatic.has(file.relative)) {
    throw new Error(
      `Projection rejected unexpected static entry: ${file.relative}`,
    )
  }
  await cp(file.path, path.join(output, file.relative))
}

const concepts = []
for (const file of knowledgeFiles.filter((candidate) =>
  candidate.relative.endsWith(".md"),
)) {
  const text = await readFile(file.path, "utf8")
  const { data, body } = parseFrontmatter(text, file.relative)
  if (!data?.type) continue
  const webPath =
    file.relative === "index.md"
      ? "/"
      : file.relative.endsWith("/index.md")
        ? `/${file.relative.slice(0, -"index.md".length)}`
        : `/${file.relative.slice(0, -".md".length)}`
  concepts.push({
    id: file.relative.replace(/\.md$/, ""),
    path: webPath,
    type: data.type,
    title: data.title ?? file.relative,
    description: data.description ?? "",
    status: data.status ?? "stable",
    tags: data.tags ?? [],
    cnix_id: data.cnix_id ?? null,
    sources: data.sources ?? [],
    body_sha256: sha256(body),
  })
}
concepts.sort((left, right) => left.id.localeCompare(right.id))

await writeFile(
  path.join(output, "knowledge.json"),
  `${JSON.stringify({ okf_version: "0.2", concepts }, null, 2)}\n`,
)

const llms = [
  "# cnix",
  "",
  "> Corbet Nix knowledge: concise public documentation, synthetic tutorials, provenance, and publication safety.",
  "",
  "Canonical source: https://github.com/julian-corbet/cnix-corbet-ch/tree/main/knowledge",
  "Machine index: https://cnix.corbet.ch/knowledge.json",
  "",
  "## Concepts",
  "",
  ...concepts.map(
    (concept) =>
      `- [${concept.title}](https://cnix.corbet.ch${concept.path}): ${concept.description}`,
  ),
  "",
]
await writeFile(path.join(output, "llms.txt"), llms.join("\n"))

const projectedFiles = await walkFiles(output)
const manifestFiles = []
for (const file of projectedFiles) {
  if (file.kind !== "file")
    throw new Error(`Projection contains a symbolic link: ${file.relative}`)
  const bytes = await readFile(file.path)
  manifestFiles.push({ path: file.relative, sha256: sha256(bytes) })
}
await writeFile(
  path.join(output, "projection-manifest.json"),
  `${JSON.stringify({ schema_version: 1, policy: "explicit-public-allowlist", files: manifestFiles }, null, 2)}\n`,
)

console.log(
  `Projected ${knowledgeFiles.length} knowledge files and ${concepts.length} concepts`,
)
