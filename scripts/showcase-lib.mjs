import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Ajv2020 from "ajv/dist/2020.js"
import { parseFrontmatter, walkFiles } from "./lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const projectSchema = JSON.parse(
  await readFile(path.join(root, "schema", "project.schema.json"), "utf8"),
)
const validateProject = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false,
}).compile(projectSchema)

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeXml(value) {
  return escapeHtml(value).replace(/&#39;/g, "&apos;")
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function schemaErrors(errors = []) {
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ")
}

export async function loadProjectConcepts(knowledgeRoot) {
  const projectsRoot = path.join(knowledgeRoot, "projects")
  let files
  try {
    files = await walkFiles(projectsRoot)
  } catch (error) {
    if (error.code === "ENOENT") return []
    throw error
  }

  const projects = []
  for (const file of files) {
    if (file.kind !== "file" || !file.relative.endsWith(".md")) continue
    const text = await readFile(file.path, "utf8")
    const { data } = parseFrontmatter(text, file.relative)
    if (data?.type !== "cnix/project") continue
    if (!validateProject(data)) {
      throw new Error(
        `${file.relative}: invalid project concept: ${schemaErrors(validateProject.errors)}`,
      )
    }
    projects.push(data)
  }

  projects.sort((left, right) => left.cnix_id.localeCompare(right.cnix_id))
  const ids = new Set()
  const hostnames = new Set(["cnix.corbet.ch"])
  for (const project of projects) {
    if (ids.has(project.cnix_id)) {
      throw new Error(`Duplicate showcase project ID: ${project.cnix_id}`)
    }
    if (hostnames.has(project.showcase.hostname)) {
      throw new Error(
        `Duplicate showcase hostname: ${project.showcase.hostname}`,
      )
    }
    ids.add(project.cnix_id)
    hostnames.add(project.showcase.hostname)
  }
  for (const project of projects) {
    for (const related of project.showcase.related_projects ?? []) {
      if (!ids.has(related)) {
        throw new Error(
          `${project.cnix_id}: related showcase does not exist: ${related}`,
        )
      }
    }
  }
  return projects
}

function statementList(items, className, numbered = false) {
  return items
    .map(
      (item, index) => `<article class="${className}">
          ${numbered ? `<span class="step-number">${index + 1}</span>` : ""}
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`,
    )
    .join("\n")
}

function relatedList(project, projectsById) {
  return (project.showcase.related_projects ?? [])
    .map((id) => projectsById.get(id))
    .filter(Boolean)
    .map((related) => {
      const destination = related.showcase.publish
        ? `https://${related.showcase.hostname}/`
        : `https://cnix.corbet.ch/projects/${related.cnix_id}`
      return `<a class="related-card" href="${escapeHtml(destination)}">
          <strong>${escapeHtml(related.title)}</strong>
          <span>${escapeHtml(related.description)}</span>
        </a>`
    })
    .join("\n")
}

export function renderShowcaseHtml(project, projectsById) {
  const { showcase } = project
  const canonical = `https://${showcase.hostname}/`
  const reference = `https://cnix.corbet.ch/projects/${project.cnix_id}`
  const related = relatedList(project, projectsById)
  const structured = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.title,
    description: project.description,
    url: canonical,
    codeRepository: project.resource,
    isPartOf: {
      "@type": "CollectionPage",
      name: "Corbet Nix projects",
      url: "https://cnix.corbet.ch/projects/",
    },
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(project.description)}">
    <meta name="theme-color" content="#0b1120">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(project.title)}">
    <meta property="og:description" content="${escapeHtml(project.description)}">
    <meta property="og:url" content="${canonical}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(project.title)}">
    <meta name="twitter:description" content="${escapeHtml(project.description)}">
    <title>${escapeHtml(project.title)} — Corbet Nix</title>
    <link rel="canonical" href="${canonical}">
    <link rel="icon" href="/icon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/style.css">
    <link rel="alternate" href="/llms.txt" type="text/plain" title="LLM index">
    <script type="application/ld+json">${safeJson(structured)}</script>
  </head>
  <body class="composition-${escapeHtml(showcase.composition)}">
    <header class="hero">
      <nav aria-label="Primary navigation">
        <a class="wordmark" href="/">${escapeHtml(project.title)}</a>
        <div class="nav-links">
          <a href="${reference}">Technical reference</a>
          <a href="${escapeHtml(project.resource)}">Source</a>
        </div>
      </nav>
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Corbet Nix project</p>
          <h1>${escapeHtml(project.title)}</h1>
          <p class="tagline">${escapeHtml(showcase.tagline)}</p>
          <p class="subtitle">${escapeHtml(project.description)}</p>
          <div class="actions">
            <a class="button primary" href="${reference}#tutorial">Try the tutorial</a>
            <a class="button secondary" href="${escapeHtml(project.resource)}">Read the source</a>
          </div>
        </div>
        <aside class="proof-panel" aria-label="How the project works">
          ${statementList(showcase.demonstration, "proof-step", true)}
        </aside>
      </div>
    </header>

    <main>
      <section class="problem-section">
        <div class="section-copy">
          <p class="eyebrow">The problem</p>
          <h2>${escapeHtml(showcase.problem)}</h2>
          <p>${escapeHtml(showcase.audience)}</p>
        </div>
      </section>

      <section class="highlights-section">
        <div class="section-heading">
          <p class="eyebrow">Why it matters</p>
          <h2>A focused part of the Corbet Nix suite</h2>
        </div>
        <div class="highlight-grid">
          ${statementList(showcase.highlights, "highlight-card")}
        </div>
      </section>

      <section class="evidence-section">
        <div>
          <p class="eyebrow">Evidence and limits</p>
          <h2>Inspect the claim, then the mechanism.</h2>
          <p>${escapeHtml(showcase.evidence)}</p>
        </div>
        <div class="evidence-actions">
          <a href="${reference}#evidence-and-limits">Review the evidence</a>
          <a href="${reference}">Read the technical reference</a>
        </div>
      </section>

      <section class="cosmos-section">
        <div class="section-heading">
          <p class="eyebrow">Project cosmos</p>
          <h2>Continue through the suite</h2>
        </div>
        ${related ? `<div class="related-grid">${related}</div>` : ""}
        <div class="cosmos-links">
          <a href="https://cnix.corbet.ch/projects/">Explore every Corbet Nix project</a>
          <a href="https://corbet.ch/">Discover the wider work</a>
        </div>
      </section>
    </main>

    <footer>
      <p>${escapeHtml(project.title)} is documented from revision-addressed public evidence.</p>
      <div>
        <a href="${reference}">Documentation</a>
        <a href="${escapeHtml(project.resource)}">Source</a>
        <a href="https://cnix.corbet.ch/projects/">Project index</a>
      </div>
    </footer>
  </body>
</html>
`
}

export function renderShowcaseCss(project) {
  return `:root {
  color-scheme: dark light;
  --bg: #0b1120;
  --bg-alt: #111827;
  --bg-card: #151f30;
  --text: #e2e8f0;
  --text-dim: #8892a6;
  --text-bright: #f8fafc;
  --accent: #34d399;
  --accent-hover: #6ee7b7;
  --accent-dim: rgba(52, 211, 153, 0.12);
  --accent-text: #0b1120;
  --project-accent: ${project.showcase.accent};
  --border: #1e293b;
  --radius: 10px;
  --radius-lg: 14px;
  --max-width: 960px;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --bg-alt: #f3f4f6;
    --bg-card: #ffffff;
    --text: #1a202c;
    --text-dim: #5a6577;
    --text-bright: #0f141a;
    --accent: #047857;
    --accent-hover: #065f46;
    --accent-dim: rgba(4, 120, 87, 0.08);
    --accent-text: #ffffff;
    --border: #e2e8f0;
  }
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
nav, .hero-grid, main > section, footer { width: min(calc(100% - 4rem), var(--max-width)); margin-inline: auto; }
nav { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; }
.wordmark, h1 { font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace; }
.wordmark { color: var(--text-bright); font-weight: 700; text-decoration: none; }
.nav-links { display: flex; gap: 1.5rem; }
.nav-links a, footer a { color: var(--text-dim); font-size: 0.9rem; text-decoration: none; }
.nav-links a:hover, footer a:hover { color: var(--accent); }
.hero {
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 55% at 75% 0%, color-mix(in srgb, var(--project-accent) 22%, transparent), transparent),
    var(--bg);
  padding-bottom: 5rem;
}
.hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 4rem; align-items: center; padding-top: 5rem; }
.eyebrow { color: var(--accent); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { margin: 0.3rem 0 0; color: var(--text-bright); font-size: clamp(2.6rem, 7vw, 4.7rem); letter-spacing: -0.05em; line-height: 1; }
.tagline { margin: 1.2rem 0 0; color: var(--accent); font-size: 1.25rem; font-weight: 600; }
.subtitle { max-width: 38rem; color: var(--text-dim); }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }
.button { display: inline-flex; padding: 0.65rem 1.3rem; border: 1px solid transparent; border-radius: 8px; font-size: 0.9rem; font-weight: 700; text-decoration: none; }
.button.primary { background: var(--accent); color: var(--accent-text); }
.button.primary:hover { background: var(--accent-hover); }
.button.secondary { border-color: var(--border); background: var(--accent-dim); color: var(--accent); }
.proof-panel { position: relative; display: grid; gap: 0.75rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--bg-card) 94%, var(--project-accent)); }
.proof-panel::before { position: absolute; inset: -1px auto -1px -1px; width: 3px; border-radius: var(--radius-lg) 0 0 var(--radius-lg); background: var(--project-accent); content: ""; }
.proof-step { display: grid; grid-template-columns: 2rem 1fr; column-gap: 0.8rem; }
.step-number { grid-row: span 2; color: var(--accent); font-family: ui-monospace, monospace; font-weight: 800; }
.proof-step h3, .highlight-card h3 { margin: 0; color: var(--text-bright); font-size: 1rem; }
.proof-step p, .highlight-card p { margin: 0.2rem 0 0; color: var(--text-dim); font-size: 0.92rem; }
main > section { padding-block: 5rem; }
h2 { margin: 0.4rem 0 1rem; color: var(--text-bright); font-size: clamp(1.7rem, 4vw, 2.5rem); letter-spacing: -0.03em; line-height: 1.2; }
.problem-section .section-copy { max-width: 46rem; }
.problem-section p:last-child, .evidence-section p { color: var(--text-dim); }
.highlights-section { width: 100%; max-width: none; padding-inline: max(2rem, calc((100% - var(--max-width)) / 2)); background: var(--bg-alt); }
.section-heading { max-width: var(--max-width); margin: 0 auto 2rem; }
.highlight-grid, .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: var(--max-width); margin: 0 auto; }
.highlight-card, .related-card { padding: 1.35rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-card); }
.highlight-card { border-top-color: var(--project-accent); }
.evidence-section { display: grid; grid-template-columns: 1fr 0.7fr; gap: 4rem; align-items: end; }
.evidence-actions, .cosmos-links { display: flex; flex-direction: column; gap: 0.75rem; }
.evidence-actions a, .cosmos-links a { color: var(--accent); font-weight: 650; text-underline-offset: 0.2em; }
.related-card { display: flex; flex-direction: column; text-decoration: none; }
.related-card strong { color: var(--text-bright); }
.related-card span { color: var(--text-dim); font-size: 0.9rem; }
.cosmos-links { margin-top: 2rem; }
footer { display: flex; justify-content: space-between; gap: 2rem; padding-block: 3rem; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 0.85rem; }
footer div { display: flex; gap: 1.25rem; }
.composition-signal .hero-copy { text-align: center; }
.composition-signal .hero-grid { grid-template-columns: 1fr; }
.composition-signal .subtitle, .composition-signal .actions { margin-inline: auto; justify-content: center; }
.composition-signal .proof-panel { grid-template-columns: repeat(3, 1fr); }
.composition-workbench .proof-panel { transform: rotate(0.6deg); box-shadow: 0 16px 70px color-mix(in srgb, var(--project-accent) 12%, transparent); }

@media (max-width: 640px) {
  nav, .hero-grid, main > section, footer { width: min(calc(100% - 2.5rem), var(--max-width)); }
  .nav-links a:first-child { display: none; }
  .hero-grid { grid-template-columns: 1fr; gap: 2.5rem; padding-top: 3rem; }
  main > section { padding-block: 3.5rem; }
  .highlights-section { width: 100%; padding-inline: 1.25rem; }
  .highlight-grid, .related-grid, .composition-signal .proof-panel, .evidence-section { grid-template-columns: 1fr; }
  footer { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
`
}

function renderShowcase404(project) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Not found — ${escapeHtml(project.title)}</title>
    <link rel="canonical" href="https://${project.showcase.hostname}/404">
    <link rel="icon" href="/icon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <main>
      <section>
        <p class="eyebrow">404</p>
        <h1>Page not found</h1>
        <p class="subtitle">Return to the ${escapeHtml(project.title)} showcase or use the technical reference.</p>
        <div class="actions">
          <a class="button primary" href="/">Project home</a>
          <a class="button secondary" href="https://cnix.corbet.ch/projects/${project.cnix_id}">Technical reference</a>
        </div>
      </section>
    </main>
  </body>
</html>
`
}

function renderIcon(project) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(project.title)}</title>
  <rect width="64" height="64" rx="12" fill="#0b1120"/>
  <path d="M14 18h36v8H22v8h24v8H22v8h-8z" fill="${project.showcase.accent}"/>
  <circle cx="47" cy="22" r="4" fill="#34d399"/>
</svg>
`
}

async function writeShowcase(directory, project, projectsById) {
  await mkdir(directory, { recursive: true })
  const canonical = `https://${project.showcase.hostname}/`
  const projectIndex = {
    schema_version: 1,
    cnix_id: project.cnix_id,
    title: project.title,
    description: project.description,
    status: project.status,
    canonical,
    technical_reference: `https://cnix.corbet.ch/projects/${project.cnix_id}`,
    source: project.resource,
    sources: project.sources,
    related_projects: project.showcase.related_projects ?? [],
  }
  const llms = `# ${project.title}

> ${project.description}

- [Project showcase](${canonical})
- [Technical reference](https://cnix.corbet.ch/projects/${project.cnix_id})
- [Public source](${project.resource})
- [Complete Corbet Nix index](https://cnix.corbet.ch/projects/)
`
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${escapeXml(canonical)}</loc></url>
</urlset>
`
  const robots = `User-agent: *
Allow: /

Sitemap: https://${project.showcase.hostname}/sitemap.xml
`

  await Promise.all([
    writeFile(
      path.join(directory, "index.html"),
      renderShowcaseHtml(project, projectsById),
    ),
    writeFile(path.join(directory, "404.html"), renderShowcase404(project)),
    writeFile(path.join(directory, "style.css"), renderShowcaseCss(project)),
    writeFile(path.join(directory, "icon.svg"), renderIcon(project)),
    writeFile(path.join(directory, "llms.txt"), llms),
    writeFile(path.join(directory, "robots.txt"), robots),
    writeFile(path.join(directory, "sitemap.xml"), sitemap),
    writeFile(
      path.join(directory, "project.json"),
      `${JSON.stringify(projectIndex, null, 2)}\n`,
    ),
  ])
}

export async function assembleReleaseBundle({
  cnixArtifact,
  knowledgeRoot,
  output,
}) {
  const projects = await loadProjectConcepts(knowledgeRoot)
  const projectsById = new Map(
    projects.map((project) => [project.cnix_id, project]),
  )
  const assets = path.join(output, "assets")
  const sitesRoot = path.join(assets, "sites")
  const cnixDestination = path.join(sitesRoot, "cnix")

  await rm(output, { recursive: true, force: true })
  await mkdir(cnixDestination, { recursive: true })
  await cp(cnixArtifact, cnixDestination, { recursive: true })

  const headers = await readFile(path.join(cnixDestination, "_headers"), "utf8")
  await writeFile(path.join(assets, "_headers"), headers)
  await rm(path.join(cnixDestination, "_headers"))

  for (const project of projects) {
    await writeShowcase(
      path.join(sitesRoot, project.cnix_id),
      project,
      projectsById,
    )
  }

  const sites = [
    {
      hostname: "cnix.corbet.ch",
      kind: "knowledge",
      asset_key: "cnix",
      publish: true,
    },
    ...projects.map((project) => ({
      hostname: project.showcase.hostname,
      kind: "showcase",
      asset_key: project.cnix_id,
      cnix_id: project.cnix_id,
      publish: project.showcase.publish,
    })),
  ]
  const publishedSites = sites.filter((site) => site.publish)
  const sitesByHostname = Object.fromEntries(
    publishedSites.map((site) => [
      site.hostname,
      {
        kind: site.kind,
        asset_key: site.asset_key,
        ...(site.cnix_id ? { cnix_id: site.cnix_id } : {}),
      },
    ]),
  )

  await mkdir(path.join(output, "worker"), { recursive: true })
  await cp(
    path.join(root, "worker", "router.mjs"),
    path.join(output, "worker", "router.mjs"),
  )
  await writeFile(
    path.join(output, "worker", "sites.mjs"),
    `export default ${JSON.stringify(sitesByHostname, null, 2)}\n`,
  )
  await writeFile(
    path.join(output, "worker", "index.mjs"),
    'import { createWorker } from "./router.mjs"\nimport sites from "./sites.mjs"\n\nexport default createWorker(sites)\n',
  )
  await writeFile(
    path.join(output, "site-manifest.json"),
    `${JSON.stringify({ schema_version: 1, sites }, null, 2)}\n`,
  )
  await writeFile(
    path.join(output, "wrangler.json"),
    `${JSON.stringify(
      {
        compatibility_date: "2026-08-12",
        main: "./worker/index.mjs",
        workers_dev: false,
        routes: publishedSites.map((site) => ({
          pattern: site.hostname,
          custom_domain: true,
        })),
        assets: {
          directory: "./assets",
          binding: "ASSETS",
          run_worker_first: true,
          not_found_handling: "404-page",
        },
      },
      null,
      2,
    )}\n`,
  )

  return { projects, sites }
}
