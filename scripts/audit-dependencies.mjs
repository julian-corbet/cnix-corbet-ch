import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execute = promisify(execFile)
const acceptedAdvisories = new Set([1124066])

let stdout
try {
  ;({ stdout } = await execute("npm", ["audit", "--json"], {
    maxBuffer: 10 * 1024 * 1024,
  }))
} catch (error) {
  stdout = error.stdout
  if (!stdout) throw error
}

const report = JSON.parse(stdout)
const observedAdvisories = new Map()
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const cause of vulnerability.via ?? []) {
    if (cause && typeof cause === "object" && cause.source) {
      observedAdvisories.set(cause.source, cause)
    }
  }
}

const unexpected = [...observedAdvisories.keys()].filter(
  (source) => !acceptedAdvisories.has(source),
)
const critical = report.metadata?.vulnerabilities?.critical ?? 0
if (critical > 0 || unexpected.length > 0) {
  console.error(
    `Dependency audit rejected ${critical} critical finding(s) and ${unexpected.length} unreviewed advisory or advisories`,
  )
  for (const source of unexpected) {
    const advisory = observedAdvisories.get(source)
    console.error(`- ${source}: ${advisory.title} (${advisory.url})`)
  }
  process.exit(1)
}

const missing = [...acceptedAdvisories].filter(
  (source) => !observedAdvisories.has(source),
)
if (missing.length > 0) {
  console.error(
    `Dependency audit baseline is stale; remove resolved advisory or advisories: ${missing.join(", ")}`,
  )
  process.exit(1)
}

console.warn(
  `Dependency audit accepted ${observedAdvisories.size} explicitly tracked advisory; see CNIX-0006`,
)
