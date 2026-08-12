import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const installed = path.join(root, "node_modules", "@jackyzha0", "quartz")
const installedPackage = JSON.parse(
  await readFile(path.join(installed, "package.json"), "utf8"),
)

if (installedPackage.version !== "5.0.0") {
  throw new Error(`Expected Quartz 5.0.0, found ${installedPackage.version}`)
}

const target = path.join(root, "quartz")
await rm(target, { recursive: true, force: true })
await cp(path.join(installed, "quartz"), target, { recursive: true })
await mkdir(path.join(target, "styles"), { recursive: true })
await cp(
  path.join(root, "site", "custom.scss"),
  path.join(target, "styles", "custom.scss"),
)

await rm(path.join(target, "static", "icon.png"), { force: true })
await rm(path.join(target, "static", "og-image.png"), { force: true })

const constantsPath = path.join(target, "cli", "constants.js")
const constants = await readFile(constantsPath, "utf8")
const patchedConstants = constants.replace(
  'export const { version } = JSON.parse(readFileSync("./package.json").toString())',
  `export const version = "${installedPackage.version}"`,
)
if (patchedConstants === constants) {
  throw new Error(
    "Quartz version source changed; refusing an unreviewed renderer patch",
  )
}
await writeFile(constantsPath, patchedConstants)

const provenance = {
  package: "@jackyzha0/quartz",
  version: installedPackage.version,
  source: "74b3fc9efd0caafea3dbcd846ddf1f06855b6d2a",
}
await writeFile(
  path.join(target, ".cnix-renderer.json"),
  `${JSON.stringify(provenance, null, 2)}\n`,
)
console.log(
  `Prepared Quartz ${installedPackage.version} from pinned source ${provenance.source}`,
)
