import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { findSensitiveText, sha256, walkFiles } from "./lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const mode = process.argv[2] ?? "source"
const failures = []

function fail(message) {
  failures.push(message)
}

async function scanSource() {
  const excluded = [
    ".git",
    ".cnix-projection",
    ".quartz",
    ".quartz-cache",
    ".wrangler",
    "node_modules",
    "public",
    "quartz",
  ]
  const files = await walkFiles(root, { exclude: excluded })
  const exactExtensionless = new Set([
    ".gitignore",
    ".node-version",
    ".prettierignore",
    "CODEOWNERS",
    "LICENSE",
    "site/static/_headers",
  ])
  const allowedExtensions = new Set([
    ".json",
    ".jsonc",
    ".md",
    ".mjs",
    ".scss",
    ".svg",
    ".toml",
    ".ts",
    ".txt",
    ".yaml",
    ".yml",
  ])

  for (const file of files) {
    if (file.kind === "symlink") {
      fail(
        `${file.relative}: symbolic links are forbidden in the public source tree`,
      )
      continue
    }
    const extension = path.extname(file.relative)
    if (
      !allowedExtensions.has(extension) &&
      !exactExtensionless.has(file.relative)
    ) {
      fail(`${file.relative}: unexpected public source file type`)
      continue
    }
    if (extension === ".svg" && file.relative !== "site/static/icon.svg") {
      fail(`${file.relative}: only the CODEOWNED cnix icon SVG is allowed`)
    }

    const text = await readFile(file.path, "utf8")
    if (file.relative !== "package-lock.json") {
      for (const finding of findSensitiveText(text, file.relative))
        fail(finding)
    }
    if (
      /\b(?:infra-corbet-ch|private\/|how it is configured)\b/i.test(text) &&
      file.relative.startsWith("knowledge/projects/")
    ) {
      fail(
        `${file.relative}: project content refers to a private sphere or repository`,
      )
    }
    if (
      extension === ".svg" &&
      /<(?:script|foreignObject)\b|\b(?:href|src)=["']https?:/i.test(text)
    ) {
      fail(`${file.relative}: SVG contains executable or external content`)
    }
  }
}

async function scanArtifact(directory) {
  const artifact = path.resolve(root, directory)
  const projection = path.resolve(root, process.argv[4] ?? ".cnix-projection")
  const files = await walkFiles(artifact)
  const allowedExtensions = new Set([
    ".css",
    ".html",
    ".ico",
    ".js",
    ".json",
    ".svg",
    ".txt",
    ".webp",
    ".woff2",
    ".xml",
  ])
  const required = new Set([
    "_headers",
    "icon.svg",
    "index.html",
    "index.xml",
    "knowledge.json",
    "llms.txt",
    "projection-manifest.json",
    "robots.txt",
    "sitemap.xml",
    "static/contentIndex.json",
  ])
  const observed = new Set(files.map((file) => file.relative))
  for (const needed of required)
    if (!observed.has(needed)) fail(`artifact: missing ${needed}`)

  for (const file of files) {
    if (file.kind === "symlink") {
      fail(`${file.relative}: artifact contains a symbolic link`)
      continue
    }
    if (file.relative === "_headers") continue
    if (!allowedExtensions.has(path.extname(file.relative))) {
      fail(`${file.relative}: unexpected artifact file type`)
      continue
    }
    if (/\.(?:map|md|yaml|yml)$/i.test(file.relative)) {
      fail(`${file.relative}: source or source map leaked into artifact`)
    }
    const extension = path.extname(file.relative)
    if ([".html", ".json", ".svg", ".txt", ".xml"].includes(extension)) {
      const text = await readFile(file.path, "utf8")
      for (const finding of findSensitiveText(
        text,
        `artifact/${file.relative}`,
      ))
        fail(finding)
    }
  }

  if (observed.has("projection-manifest.json")) {
    const manifest = JSON.parse(
      await readFile(path.join(artifact, "projection-manifest.json"), "utf8"),
    )
    if (
      manifest.schema_version !== 1 ||
      manifest.policy !== "explicit-public-allowlist" ||
      !Array.isArray(manifest.files)
    ) {
      fail("artifact manifest has an unknown schema or policy")
    }
    const manifestPaths = new Set()
    for (const entry of manifest.files ?? []) {
      if (
        typeof entry.path !== "string" ||
        path.isAbsolute(entry.path) ||
        entry.path.split("/").includes("..")
      ) {
        fail("artifact manifest contains an unsafe projection path")
        continue
      }
      if (manifestPaths.has(entry.path)) {
        fail(`artifact manifest repeats projection file ${entry.path}`)
        continue
      }
      manifestPaths.add(entry.path)
      const projected = path.join(projection, entry.path)
      let bytes
      try {
        bytes = await readFile(projected)
      } catch {
        fail(
          `artifact manifest references missing projection file ${entry.path}`,
        )
        continue
      }
      if (sha256(bytes) !== entry.sha256)
        fail(`projection hash changed for ${entry.path}`)
    }
    const projectionFiles = await walkFiles(projection)
    for (const projected of projectionFiles) {
      if (
        projected.relative !== "projection-manifest.json" &&
        !manifestPaths.has(projected.relative)
      ) {
        fail(`artifact manifest omits projection file ${projected.relative}`)
      }
    }
  }

  const index = observed.has("index.html")
    ? await readFile(path.join(artifact, "index.html"), "utf8")
    : ""
  if (!index.includes('type="application/ld+json"'))
    fail("artifact: homepage lacks JSON-LD")
  if (index.includes("Quartz v0.1.0"))
    fail("artifact: renderer version is misreported")

  for (const file of files.filter(
    (candidate) =>
      candidate.kind === "file" && candidate.relative.endsWith(".html"),
  )) {
    const html = await readFile(file.path, "utf8")
    if (/<title>(?:Untitled|index|log)\b/i.test(html)) {
      fail(`${file.relative}: page has a placeholder title`)
    }
    if (
      !/<link rel="canonical" href="https:\/\/cnix\.corbet\.ch\//.test(html)
    ) {
      fail(`${file.relative}: page lacks a canonical URL`)
    }
    if (
      /<script\b[^>]*src="https?:\/\//i.test(html) ||
      /<link\b[^>]*rel="(?:preconnect|stylesheet)"[^>]*href="https?:\/\//i.test(
        html,
      )
    ) {
      fail(`${file.relative}: page loads an external script or stylesheet`)
    }
    if (/static\/(?:icon|og-image)\.png/.test(html)) {
      fail(`${file.relative}: page references a forbidden default image`)
    }
    if (/okf_version/.test(html)) {
      fail(
        `${file.relative}: OKF bundle metadata leaked into visible page content`,
      )
    }
    const topLevelHeadings = [...html.matchAll(/<h1\b/g)].length
    if (topLevelHeadings !== 1) {
      fail(`${file.relative}: expected one h1, found ${topLevelHeadings}`)
    }
  }
  if (files.some((file) => file.relative.startsWith("tags/"))) {
    fail("artifact: thin generated tag pages are forbidden")
  }
}

if (mode === "source") await scanSource()
else if (mode === "artifact") await scanArtifact(process.argv[3] ?? "public")
else throw new Error(`Unknown guardian mode: ${mode}`)

if (failures.length > 0) {
  console.error(`Guardian rejected ${mode} with ${failures.length} finding(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Guardian accepted ${mode}`)
