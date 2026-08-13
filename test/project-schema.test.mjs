import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import Ajv2020 from "ajv/dist/2020.js"

const schema = JSON.parse(
  await readFile(
    new URL("../schema/project.schema.json", import.meta.url),
    "utf8",
  ),
)
const validate = new Ajv2020({ strict: false, validateFormats: false }).compile(
  schema,
)

function project(overrides = {}) {
  return {
    type: "cnix/project",
    title: "nixea",
    description: "A synthetic project used to test the schema.",
    cnix_id: "nixea",
    status: "draft",
    showcase: {
      hostname: "nixea.corbet.ch",
      tagline: "A concise public promise",
      audience: "People evaluating a synthetic Nix project",
      accent: "#0f766e",
      publish: false,
      composition: "signal",
      problem: "A synthetic problem for schema validation.",
      demonstration: [
        { title: "Declare", description: "Describe an intended state." },
        { title: "Build", description: "Produce a checked result." },
        { title: "Inspect", description: "Review the resulting evidence." },
      ],
      highlights: [
        { title: "Portable", description: "Uses a portable test fixture." },
        { title: "Reviewable", description: "Keeps evidence inspectable." },
        { title: "Bounded", description: "Makes test limits explicit." },
      ],
      evidence: "The schema test validates this synthetic contract.",
      related_projects: [],
    },
    resource: "https://example.org/project",
    sources: [{ resource: "https://example.org/source" }],
    ...overrides,
  }
}

test("project schema requires a valid showcase contract", () => {
  assert.equal(validate(project()), true)
  assert.equal(validate(project({ showcase: undefined })), false)
  assert.equal(
    validate(
      project({
        showcase: {
          hostname: "example.com",
          tagline: "Promise",
          audience: "Audience",
          accent: "green",
        },
      }),
    ),
    false,
  )
})
