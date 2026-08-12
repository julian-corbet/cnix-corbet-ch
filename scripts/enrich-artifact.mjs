import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { walkFiles } from "./lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artifact = path.resolve(root, process.argv[2] ?? "public")
const installedPackage = JSON.parse(
  await readFile(
    path.join(root, "node_modules", "@jackyzha0", "quartz", "package.json"),
    "utf8",
  ),
)

function attribute(html, expression) {
  return (
    html
      .match(expression)?.[1]
      ?.replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&") ?? ""
  )
}

function textContent(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .trim()
}

function escapeAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeXml(value) {
  return escapeAttribute(value).replace(/'/g, "&apos;")
}

function canonicalUrl(relative) {
  if (relative === "index.html") return "https://cnix.corbet.ch/"
  if (relative.endsWith("/index.html")) {
    return `https://cnix.corbet.ch/${relative.slice(0, -"index.html".length)}`
  }
  return `https://cnix.corbet.ch/${relative.slice(0, -".html".length)}`
}

const pages = []
const htmlFiles = (await walkFiles(artifact)).filter((candidate) =>
  candidate.relative.endsWith(".html"),
)
for (const file of htmlFiles) {
  let html = await readFile(file.path, "utf8")
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
  const visibleTitle = textContent(headings.at(-1)?.[1] ?? "")
  const title = visibleTitle.endsWith("— Corbet Nix")
    ? visibleTitle
    : `${visibleTitle || "cnix"} — Corbet Nix`
  const encodedTitle = escapeAttribute(title)
  let description = attribute(
    html,
    /<meta name="description" content="([^"]*)"/,
  )
  if (description.startsWith(`${visibleTitle} `)) {
    description = description.slice(visibleTitle.length + 1)
  }
  const encodedDescription = escapeAttribute(description)
  const canonical = canonicalUrl(file.relative)
  const structured = {
    "@context": "https://schema.org",
    "@type":
      file.relative === "index.html"
        ? "WebSite"
        : file.relative === "404.html"
          ? "WebPage"
          : file.relative.endsWith("/index.html") ||
              file.relative === "log.html"
            ? "CollectionPage"
            : "TechArticle",
    name: title,
    headline: title,
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: "cnix",
      url: "https://cnix.corbet.ch/",
    },
  }
  const json = JSON.stringify(structured).replace(/</g, "\\u003c")
  const extras = [
    `<link rel="canonical" href="${canonical}"/>`,
    '<link rel="icon" href="/icon.svg" type="image/svg+xml"/>',
    '<link rel="alternate" href="/llms.txt" type="text/plain" title="LLM index"/>',
    `<script type="application/ld+json">${json}</script>`,
  ].join("")
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${encodedTitle}</title>`)
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${encodedTitle}$2`,
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${encodedTitle}$2`,
    )
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${encodedDescription}$2`,
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${encodedDescription}$2`,
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${encodedDescription}$2`,
    )
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
    .replace(
      /(<meta property="twitter:url" content=")[^"]*(")/,
      `$1${canonical}$2`,
    )
    .replace(/<link rel="icon" href="[^"]*static\/icon\.png"\/>/g, "")
    .replace(
      /<meta (?:name|property)="(?:og:image(?::url|:alt|:type)?|twitter:image)"[^>]*\/>/g,
      "",
    )
    .replace(
      /<link rel="preconnect" href="https:\/\/cdnjs\.cloudflare\.com"[^>]*\/>/g,
      "",
    )
  if (headings.length > 1) {
    html = html.replace(/<h1 class="article-title">[^<]*<\/h1>/, "")
  }
  html = html.replace("</head>", `${extras}</head>`)
  html = html.replaceAll(`Quartz v0.1.0`, `Quartz v${installedPackage.version}`)
  await writeFile(file.path, html)
  if (file.relative !== "404.html") {
    pages.push({
      slug: file.relative.replace(/\.html$/, ""),
      canonical,
      title: visibleTitle,
      description,
    })
  }
}

pages.sort((left, right) => left.canonical.localeCompare(right.canonical))

const contentIndexPath = path.join(artifact, "static", "contentIndex.json")
const contentIndex = JSON.parse(await readFile(contentIndexPath, "utf8"))
for (const page of pages) {
  const entry = contentIndex[page.slug]
  if (entry) entry.title = page.title
}
await writeFile(contentIndexPath, `${JSON.stringify(contentIndex)}\n`)

const sitemap = [
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => `<url><loc>${escapeXml(page.canonical)}</loc></url>`),
  "</urlset>",
  "",
].join("\n")
await writeFile(path.join(artifact, "sitemap.xml"), sitemap)

const machineIndex = JSON.parse(
  await readFile(path.join(artifact, "knowledge.json"), "utf8"),
)
const rssItems = machineIndex.concepts.map(
  (concept) => `  <item>
    <title>${escapeXml(concept.title)}</title>
    <link>https://cnix.corbet.ch${escapeXml(concept.path)}</link>
    <guid>https://cnix.corbet.ch${escapeXml(concept.path)}</guid>
    <description>${escapeXml(concept.description)}</description>
  </item>`,
)
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>cnix</title>
  <link>https://cnix.corbet.ch/</link>
  <description>Verified public concepts in the Corbet Nix knowledge bundle.</description>
${rssItems.join("\n")}
</channel>
</rss>
`
await writeFile(path.join(artifact, "index.xml"), rss)

console.log(
  `Enriched HTML with JSON-LD and Quartz ${installedPackage.version} provenance`,
)
