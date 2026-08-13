import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import {
  assembleReleaseBundle,
  renderShowcaseHtml,
} from "../scripts/showcase-lib.mjs"
import { createWorker, resolveSiteRequest } from "../worker/router.mjs"

function showcase(overrides = {}) {
  const project = {
    type: "cnix/project",
    title: "nixfixture",
    description: "A synthetic project used to exercise showcase generation.",
    cnix_id: "nixfixture",
    resource: "https://example.org/nixfixture",
    status: "draft",
    showcase: {
      hostname: "nixfixture.corbet.ch",
      tagline: "Compile a checked fixture",
      audience: "People testing a generated Nix project showcase",
      accent: "#2563eb",
      publish: true,
      composition: "system",
      problem: "A project needs one reviewed concept for two public views.",
      demonstration: [
        { title: "Describe", description: "Record a public concept." },
        { title: "Compile", description: "Generate host-local assets." },
        { title: "Review", description: "Inspect the exact release bundle." },
      ],
      highlights: [
        {
          title: "Deterministic",
          description: "The same input is repeatable.",
        },
        {
          title: "Host-aware",
          description: "One publisher selects each site.",
        },
        { title: "Local", description: "Runtime assets stay in the artifact." },
      ],
      evidence: "The synthetic test inspects the emitted files and routes.",
      related_projects: [],
    },
    sources: [{ resource: "https://example.org/nixfixture/tree/revision" }],
  }
  return {
    ...project,
    ...overrides,
    showcase: {
      ...project.showcase,
      ...(overrides.showcase ?? {}),
    },
  }
}

test("showcase HTML separates marketing navigation from technical reference", () => {
  const html = renderShowcaseHtml(showcase(), new Map())

  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/nixfixture\.corbet\.ch\/"/,
  )
  assert.match(
    html,
    /https:\/\/cnix\.corbet\.ch\/projects\/nixfixture#tutorial/,
  )
  assert.match(html, /https:\/\/cnix\.corbet\.ch\/projects\/nixfixture/)
  assert.match(html, /https:\/\/example\.org\/nixfixture/)
  assert.match(html, /href="\/style\.css"/)
  assert.doesNotMatch(html, /<script\b[^>]*src="https?:\/\//i)
  assert.doesNotMatch(
    html,
    /<link\b[^>]*rel="stylesheet"[^>]*href="https?:\/\//i,
  )
})

test("release bundle contains exact host routes and isolated site assets", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "cnix-showcase-test-"))
  const cnixArtifact = path.join(temporary, "cnix")
  const knowledgeRoot = path.join(temporary, "knowledge")
  const output = path.join(temporary, "release")

  try {
    await mkdir(path.join(knowledgeRoot, "projects"), { recursive: true })
    await mkdir(cnixArtifact, { recursive: true })
    await writeFile(path.join(cnixArtifact, "index.html"), "<h1>cnix</h1>\n")
    await writeFile(path.join(cnixArtifact, "404.html"), "<h1>Missing</h1>\n")
    await writeFile(
      path.join(cnixArtifact, "_headers"),
      "/*\n  X-Frame-Options: DENY\n",
    )
    await writeFile(
      path.join(knowledgeRoot, "projects", "nixfixture.md"),
      `---\n${JSON.stringify(showcase())}\n---\n`,
    )
    await writeFile(
      path.join(knowledgeRoot, "projects", "nixstaged.md"),
      `---\n${JSON.stringify(
        showcase({
          title: "nixstaged",
          cnix_id: "nixstaged",
          resource: "https://example.org/nixstaged",
          showcase: {
            hostname: "nixstaged.corbet.ch",
            publish: false,
          },
          sources: [
            { resource: "https://example.org/nixstaged/tree/revision" },
          ],
        }),
      )}\n---\n`,
    )

    await assembleReleaseBundle({ cnixArtifact, knowledgeRoot, output })

    const manifest = JSON.parse(
      await readFile(path.join(output, "site-manifest.json"), "utf8"),
    )
    const wrangler = JSON.parse(
      await readFile(path.join(output, "wrangler.json"), "utf8"),
    )
    assert.deepEqual(
      manifest.sites.map((site) => site.hostname),
      ["cnix.corbet.ch", "nixfixture.corbet.ch", "nixstaged.corbet.ch"],
    )
    assert.deepEqual(
      wrangler.routes.map((route) => route.pattern),
      ["cnix.corbet.ch", "nixfixture.corbet.ch"],
    )
    assert.equal(wrangler.assets.directory, "./assets")
    assert.equal(wrangler.assets.run_worker_first, true)
    assert.match(
      await readFile(
        path.join(output, "assets", "sites", "nixfixture", "index.html"),
        "utf8",
      ),
      /Compile a checked fixture/,
    )
    assert.equal(
      await readFile(path.join(output, "assets", "_headers"), "utf8"),
      "/*\n  X-Frame-Options: DENY\n",
    )
    assert.match(
      await readFile(
        path.join(output, "assets", "sites", "nixstaged", "index.html"),
        "utf8",
      ),
      /nixstaged/,
    )
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})

test("host router isolates sites and reconciles legacy docs routes", async () => {
  const sites = {
    "cnix.corbet.ch": { kind: "knowledge", asset_key: "cnix" },
    "nixfixture.corbet.ch": {
      kind: "showcase",
      asset_key: "nixfixture",
      cnix_id: "nixfixture",
    },
  }

  const routed = resolveSiteRequest(
    new Request("https://nixfixture.corbet.ch/style.css"),
    sites,
  )
  assert.equal(routed.kind, "asset")
  assert.equal(
    new URL(routed.request.url).pathname,
    "/sites/nixfixture/style.css",
  )

  const fetched = []
  const worker = createWorker(sites)
  const response = await worker.fetch(
    new Request("https://nixfixture.corbet.ch/docs/options"),
    {
      ASSETS: {
        fetch(request) {
          fetched.push(request.url)
          return new Response("asset")
        },
      },
    },
  )
  assert.equal(response.status, 308)
  assert.equal(
    response.headers.get("location"),
    "https://cnix.corbet.ch/projects/nixfixture",
  )
  assert.deepEqual(fetched, [])

  const missing = await worker.fetch(
    new Request("https://unknown.example.org/"),
    { ASSETS: { fetch: () => new Response("unexpected") } },
  )
  assert.equal(missing.status, 404)
})
