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
      related_projects: [],
    },
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
