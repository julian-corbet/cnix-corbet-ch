import { createHash } from "node:crypto"
import { lstat, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import YAML from "yaml"

export const POSIX = (value) => value.split(path.sep).join("/")

export async function walkFiles(root, options = {}) {
  const excluded = new Set(options.exclude ?? [])
  const files = []

  async function descend(current, relative = "") {
    const entries = await readdir(current, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))

    for (const entry of entries) {
      const childRelative = POSIX(path.join(relative, entry.name))
      const firstSegment = childRelative.split("/")[0]
      if (excluded.has(firstSegment)) continue

      const child = path.join(current, entry.name)
      const info = await lstat(child)
      if (info.isSymbolicLink()) {
        files.push({ path: child, relative: childRelative, kind: "symlink" })
      } else if (info.isDirectory()) {
        await descend(child, childRelative)
      } else if (info.isFile()) {
        files.push({ path: child, relative: childRelative, kind: "file" })
      }
    }
  }

  await descend(root)
  return files
}

export function parseFrontmatter(text, file = "document") {
  if (!text.startsWith("---\n")) {
    return { data: null, body: text, raw: null }
  }

  const end = text.indexOf("\n---\n", 4)
  if (end === -1) throw new Error(`${file}: frontmatter is not closed`)

  const raw = text.slice(4, end)
  const data = YAML.parse(raw)
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${file}: frontmatter must be a YAML mapping`)
  }

  return { data, body: text.slice(end + 5), raw }
}

export function extractMarkdownLinks(markdown) {
  const links = []
  const expression = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g
  for (const match of markdown.matchAll(expression)) {
    let target = match[1].trim()
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1)
    }
    const titleSeparator = target.search(/\s+["']/)
    if (titleSeparator !== -1) target = target.slice(0, titleSeparator)
    links.push(target)
  }
  return links
}

export function extractHeadings(markdown) {
  return [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) =>
    match[1].replace(/\s+#+$/, "").trim(),
  )
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

export function isDocumentationAddress(address) {
  const parts = address.split(".").map(Number)
  if (parts[0] === 127) return true
  if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true
  if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true
  if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true
  return false
}

export function findSensitiveText(text, relative = "document") {
  const findings = []
  const checks = [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g],
    ["GitHub token", /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/g],
    ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
    ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
    ["credential in URL", /https?:\/\/[^\s/@:]+:[^\s/@]+@/g],
    [
      "credential assignment",
      /\b(?:api[_-]?key|password|passwd|secret|token)\s*[:=]\s*["']?(?![<{[])([A-Za-z0-9_+./=-]{12,})/gi,
    ],
    ["local home path", /(?:^|[\s"'`(])\/(?:home|Users)\/[A-Za-z0-9._-]+\//gm],
    ["file URI", /\bfile:\/\//gi],
  ]

  for (const [name, expression] of checks) {
    for (const match of text.matchAll(expression)) {
      findings.push(`${relative}: ${name} near byte ${match.index}`)
    }
  }

  const entropyExpression = /\b[A-Za-z0-9+_=-]{32,}\b/g
  for (const match of text.matchAll(entropyExpression)) {
    const candidate = match[0]
    const characterClasses = [/[a-z]/, /[A-Z]/, /[0-9]/, /[+_=-]/].filter(
      (expression) => expression.test(candidate),
    ).length
    if (characterClasses < 3) continue

    const frequencies = new Map()
    for (const character of candidate) {
      frequencies.set(character, (frequencies.get(character) ?? 0) + 1)
    }
    const entropy = [...frequencies.values()].reduce((total, frequency) => {
      const probability = frequency / candidate.length
      return total - probability * Math.log2(probability)
    }, 0)
    if (entropy >= 4.2) {
      findings.push(
        `${relative}: suspicious high-entropy string near byte ${match.index}`,
      )
    }
  }

  const addressExpression = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
  for (const match of text.matchAll(addressExpression)) {
    const address = match[0]
    const valid = address.split(".").every((part) => Number(part) <= 255)
    if (valid && !isDocumentationAddress(address)) {
      findings.push(`${relative}: non-documentation IP address ${address}`)
    }
  }

  return findings
}

export async function readUtf8(file) {
  return readFile(file, "utf8")
}

export function wordCount(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}
