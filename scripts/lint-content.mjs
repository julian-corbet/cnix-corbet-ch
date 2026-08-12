import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Ajv2020 from "ajv/dist/2020.js"
import {
  extractHeadings,
  extractMarkdownLinks,
  parseFrontmatter,
  walkFiles,
  wordCount,
} from "./lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const knowledgeRoot = path.join(root, "knowledge")
const failures = []

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false,
})
const projectSchema = JSON.parse(
  await readFile(path.join(root, "schema/project.schema.json"), "utf8"),
)
const findingSchema = JSON.parse(
  await readFile(path.join(root, "schema/finding.schema.json"), "utf8"),
)
const validateProject = ajv.compile(projectSchema)
const validateFinding = ajv.compile(findingSchema)

function fail(message) {
  failures.push(message)
}

function formatAjv(errors = []) {
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ")
}

function lintLinks(relative, body, allPaths) {
  for (const target of extractMarkdownLinks(body)) {
    if (/^(?:https?:|mailto:|#)/.test(target)) continue

    const withoutFragment = decodeURIComponent(target.split("#", 1)[0])
    if (!withoutFragment) continue
    const base = path.posix.dirname(relative)
    let resolved = withoutFragment.startsWith("/")
      ? withoutFragment.slice(1)
      : path.posix.normalize(path.posix.join(base, withoutFragment))

    if (resolved.endsWith("/")) resolved += "index.md"
    if (!path.posix.extname(resolved)) {
      if (allPaths.has(`${resolved}.md`)) resolved += ".md"
      else if (allPaths.has(`${resolved}/index.md`)) resolved += "/index.md"
    }
    if (!allPaths.has(resolved))
      fail(`${relative}: broken internal link ${target}`)
  }
}

function lintProject(relative, data, body) {
  if (!validateProject(data)) {
    fail(`${relative}: project schema: ${formatAjv(validateProject.errors)}`)
  }

  const required = [
    "Summary",
    "What it is",
    "How it works",
    "How to configure it",
    "Tutorial",
    "Evidence and limits",
    "Related",
  ]
  const headings = extractHeadings(body)
  let cursor = -1
  for (const heading of required) {
    const next = headings.indexOf(heading)
    if (next === -1) fail(`${relative}: missing required heading “${heading}”`)
    else if (next <= cursor)
      fail(`${relative}: heading “${heading}” is out of order`)
    cursor = next
  }

  if (wordCount(body) > 2200) {
    fail(
      `${relative}: public project page exceeds the 2,200-word human-reading budget`,
    )
  }

  const tutorial =
    body.match(/(?:^|\n)#{1,6} Tutorial\n([\s\S]*?)(?=\n#{1,6} |$)/)?.[1] ?? ""
  if (/\bredact(?:ed|ion)?\b/i.test(tutorial)) {
    fail(`${relative}: tutorials must be synthetic, not redacted`)
  }
  for (const block of tutorial.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    const firstLine = block[1].split("\n").find((line) => line.trim()) ?? ""
    if (!/synthetic example/i.test(firstLine)) {
      fail(
        `${relative}: each tutorial code block must begin with a synthetic-example marker`,
      )
    }
  }

  for (const source of data.sources ?? []) {
    if (!/^https:\/\//.test(source.resource)) {
      fail(
        `${relative}: public project sources must use followable HTTPS resources`,
      )
    }
  }
}

function lintTodos(markdown) {
  const sections = [...markdown.matchAll(/^## (CNIX-\d{4}) — (.+)$/gm)]
  const ids = new Set()
  for (let index = 0; index < sections.length; index += 1) {
    const [heading, id, title] = sections[index]
    const start = sections[index].index + heading.length
    const end = sections[index + 1]?.index ?? markdown.length
    const body = markdown.slice(start, end)
    const field = (name) =>
      body.match(new RegExp(`^- ${name}:\\s*(.+)$`, "mi"))?.[1].trim() ?? ""
    const finding = {
      id,
      title,
      status: field("Status"),
      severity: field("Severity"),
      owner: field("Owner"),
      evidence: field("Evidence"),
      acceptance: field("Acceptance"),
    }
    if (ids.has(id)) fail(`TODO.md: duplicate finding ${id}`)
    ids.add(id)
    if (!validateFinding(finding)) {
      fail(`TODO.md: ${id}: ${formatAjv(validateFinding.errors)}`)
    }
  }
  if (sections.length === 0) fail("TODO.md: no structured CNIX findings found")
}

const files = await walkFiles(knowledgeRoot)
const markdownFiles = files.filter(
  (file) => file.kind === "file" && file.relative.endsWith(".md"),
)
const allPaths = new Set(markdownFiles.map((file) => file.relative))
const conceptIds = new Set()

for (const file of markdownFiles) {
  const text = await readFile(file.path, "utf8")
  let parsed
  try {
    parsed = parseFrontmatter(text, file.relative)
  } catch (error) {
    fail(error.message)
    continue
  }

  const basename = path.posix.basename(file.relative)
  const reserved = basename === "index.md" || basename === "log.md"
  if (!reserved && !parsed.data?.type) {
    fail(`${file.relative}: OKF concept requires a type`)
  }
  if (basename === "index.md" && parsed.data) {
    const allowed =
      file.relative === "index.md" &&
      Object.keys(parsed.data).join(",") === "okf_version"
    if (!allowed)
      fail(`${file.relative}: OKF index files do not carry concept frontmatter`)
  }
  if (basename === "log.md" && parsed.data) {
    fail(`${file.relative}: OKF log files do not carry frontmatter`)
  }
  if (/\[\[[\s\S]*?\]\]/.test(text)) {
    fail(`${file.relative}: use portable Markdown links instead of wikilinks`)
  }
  if (
    /<(?:script|iframe|object|embed|style|link|meta|svg|form|input|button)\b/i.test(
      parsed.body,
    )
  ) {
    fail(`${file.relative}: raw executable or embedded HTML is not allowed`)
  }

  lintLinks(file.relative, parsed.body, allPaths)

  if (parsed.data?.type === "cnix/project") {
    lintProject(file.relative, parsed.data, parsed.body)
    if (conceptIds.has(parsed.data.cnix_id)) {
      fail(`${file.relative}: duplicate cnix_id ${parsed.data.cnix_id}`)
    }
    conceptIds.add(parsed.data.cnix_id)
  } else if (file.relative.startsWith("projects/") && !reserved) {
    fail(`${file.relative}: project concepts must use type cnix/project`)
  }
}

lintTodos(await readFile(path.join(root, "TODO.md"), "utf8"))

if (failures.length > 0) {
  console.error(`Content lint failed with ${failures.length} finding(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Content lint passed: ${markdownFiles.length} Markdown files, ${conceptIds.size} projects`,
)
