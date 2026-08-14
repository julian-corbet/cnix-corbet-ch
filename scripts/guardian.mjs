import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  findExternalExecutableUrls,
  findSensitiveText,
  isAllowedArtifactPath,
  sha256,
  walkFiles,
} from "./lib.mjs"

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
    ".cnix-release",
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
      /(?:\bprivate\/|\bhow it is configured\b)/i.test(text) &&
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
  const required = new Set([
    "assets/_headers",
    "assets/sites/cnix/icon.svg",
    "assets/sites/cnix/index.html",
    "assets/sites/cnix/index.xml",
    "assets/sites/cnix/knowledge.json",
    "assets/sites/cnix/llms.txt",
    "assets/sites/cnix/projection-manifest.json",
    "assets/sites/cnix/robots.txt",
    "assets/sites/cnix/sitemap.xml",
    "assets/sites/cnix/static/contentIndex.json",
    "site-manifest.json",
    "worker/index.mjs",
    "wrangler.json",
  ])
  const observed = new Set(files.map((file) => file.relative))
  for (const needed of required)
    if (!observed.has(needed)) fail(`artifact: missing ${needed}`)

  for (const file of files) {
    if (file.kind === "symlink") {
      fail(`${file.relative}: artifact contains a symbolic link`)
      continue
    }
    if (!isAllowedArtifactPath(file.relative)) {
      fail(`${file.relative}: unexpected artifact file type`)
      continue
    }
    if (/\.(?:map|md|yaml|yml)$/i.test(file.relative)) {
      fail(`${file.relative}: source or source map leaked into artifact`)
    }
    const extension = path.extname(file.relative)
    if (
      file.relative === "assets/_headers" ||
      [
        ".css",
        ".html",
        ".js",
        ".json",
        ".mjs",
        ".svg",
        ".txt",
        ".xml",
      ].includes(extension)
    ) {
      const bytes = await readFile(file.path)
      let text
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
      } catch {
        fail(`${file.relative}: artifact is not valid UTF-8`)
        continue
      }
      for (const finding of findSensitiveText(
        text,
        `artifact/${file.relative}`,
      ))
        fail(finding)
      if ([".css", ".js"].includes(extension)) {
        for (const finding of findExternalExecutableUrls(
          text,
          `artifact/${file.relative}`,
        ))
          fail(finding)
      }
    }
  }

  let siteManifest = null
  if (observed.has("site-manifest.json")) {
    siteManifest = JSON.parse(
      await readFile(path.join(artifact, "site-manifest.json"), "utf8"),
    )
    if (
      siteManifest.schema_version !== 1 ||
      !Array.isArray(siteManifest.sites) ||
      siteManifest.sites.length === 0
    ) {
      fail("site manifest has an unknown schema or no sites")
      siteManifest = null
    }
  }

  const sites = siteManifest?.sites ?? []
  const hostnames = new Set()
  const assetKeys = new Set()
  for (const site of sites) {
    if (
      typeof site.hostname !== "string" ||
      typeof site.asset_key !== "string" ||
      typeof site.publish !== "boolean" ||
      !["knowledge", "showcase"].includes(site.kind)
    ) {
      fail("site manifest contains an invalid site entry")
      continue
    }
    if (hostnames.has(site.hostname))
      fail(`site manifest repeats hostname ${site.hostname}`)
    if (assetKeys.has(site.asset_key))
      fail(`site manifest repeats asset key ${site.asset_key}`)
    hostnames.add(site.hostname)
    assetKeys.add(site.asset_key)

    if (site.kind === "knowledge") {
      if (
        site.hostname !== "cnix.corbet.ch" ||
        site.asset_key !== "cnix" ||
        site.publish !== true ||
        site.cnix_id !== undefined
      ) {
        fail("site manifest contains an invalid cnix knowledge host")
      }
    } else if (
      !/^nix[a-z0-9-]+$/.test(site.cnix_id ?? "") ||
      site.asset_key !== site.cnix_id ||
      site.hostname !== `${site.cnix_id}.corbet.ch`
    ) {
      fail(`site manifest contains an invalid showcase host ${site.hostname}`)
    }
  }
  if (!hostnames.has("cnix.corbet.ch"))
    fail("site manifest omits cnix.corbet.ch")

  const publishedHostnames = new Set(
    sites.filter((site) => site.publish).map((site) => site.hostname),
  )

  for (const file of files.filter((candidate) =>
    candidate.relative.startsWith("assets/"),
  )) {
    if (file.relative === "assets/_headers") continue
    if (!file.relative.startsWith("assets/sites/")) {
      fail(`${file.relative}: artifact contains an unlisted asset root`)
      continue
    }
    const assetKey = file.relative.split("/")[2]
    if (!assetKeys.has(assetKey)) {
      fail(`${file.relative}: artifact contains an unlisted site directory`)
    }
  }

  const showcaseRequired = [
    "404.html",
    "icon.svg",
    "index.html",
    "llms.txt",
    "project.json",
    "robots.txt",
    "sitemap.xml",
    "style.css",
  ]
  for (const site of sites.filter(
    (candidate) => candidate.kind === "showcase",
  )) {
    for (const relative of showcaseRequired) {
      const expected = `assets/sites/${site.asset_key}/${relative}`
      if (!observed.has(expected)) fail(`artifact: missing ${expected}`)
    }
  }

  if (observed.has("wrangler.json")) {
    const wrangler = JSON.parse(
      await readFile(path.join(artifact, "wrangler.json"), "utf8"),
    )
    if (
      wrangler.main !== "./worker/index.mjs" ||
      wrangler.assets?.directory !== "./assets" ||
      wrangler.assets?.binding !== "ASSETS" ||
      wrangler.assets?.run_worker_first !== true
    ) {
      fail("release Wrangler config does not bind the reviewed host router")
    }
    const routeHostnames = new Set()
    for (const route of wrangler.routes ?? []) {
      if (route.custom_domain !== true || typeof route.pattern !== "string") {
        fail("release Wrangler config contains a non-custom-domain route")
        continue
      }
      routeHostnames.add(route.pattern)
    }
    if (
      routeHostnames.size !== publishedHostnames.size ||
      [...publishedHostnames].some((hostname) => !routeHostnames.has(hostname))
    ) {
      fail("release Wrangler routes do not exactly match the site manifest")
    }
  }

  if (observed.has("worker/index.mjs")) {
    const worker = await readFile(
      path.join(artifact, "worker", "index.mjs"),
      "utf8",
    )
    for (const site of sites) {
      const present = worker.includes(JSON.stringify(site.hostname))
      if (present !== site.publish) {
        fail(`pre-bundled worker publish state drifted for ${site.hostname}`)
      }
    }
    if (
      !worker.includes("/sites/") ||
      !worker.includes("https://cnix.corbet.ch/projects/") ||
      /\bfrom\s+["']\.\//.test(worker)
    ) {
      fail("pre-bundled worker does not contain the self-contained host router")
    }
  }

  const projectionManifestPath = "assets/sites/cnix/projection-manifest.json"
  if (observed.has(projectionManifestPath)) {
    const manifest = JSON.parse(
      await readFile(path.join(artifact, projectionManifestPath), "utf8"),
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

  const cnixIndexPath = "assets/sites/cnix/index.html"
  const index = observed.has(cnixIndexPath)
    ? await readFile(path.join(artifact, cnixIndexPath), "utf8")
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
    const site = sites.find((candidate) =>
      file.relative.startsWith(`assets/sites/${candidate.asset_key}/`),
    )
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    if (!site || !canonical)
      fail(`${file.relative}: page lacks a canonical URL`)
    else {
      let hostname = ""
      try {
        hostname = new URL(canonical).hostname
      } catch {
        fail(`${file.relative}: page has an invalid canonical URL`)
      }
      if (hostname && hostname !== site.hostname) {
        fail(
          `${file.relative}: canonical URL belongs to ${hostname}, not ${site.hostname}`,
        )
      }
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
  if (
    files.some((file) => file.relative.startsWith("assets/sites/cnix/tags/"))
  ) {
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
