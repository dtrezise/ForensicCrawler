import { dirname, resolve } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";
import { canonicalStringify, readJson, ROOT, sha256 } from "./lib.mjs";

const manifestInput = process.argv[2];
if (!manifestInput) throw new Error("Usage: node scripts/verify-manifest.mjs <manifest.json>");
const manifest = readJson(manifestInput);
const directory = dirname(resolve(ROOT, manifestInput));
const issues = [];
for (const file of manifest.files) {
  const path = resolve(directory, file.path);
  if (!existsSync(path)) { issues.push(`missing ${file.path}`); continue; }
  const bytes = readFileSync(path);
  if (sha256(bytes) !== file.sha256) issues.push(`hash mismatch ${file.path}`);
  if (statSync(path).size !== file.byteSize) issues.push(`size mismatch ${file.path}`);
}
if (sha256(canonicalStringify(manifest.files)) !== manifest.rootHash) issues.push("root hash mismatch");
if (issues.length) {
  issues.forEach((issue) => console.error(`FAIL ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`PASS manifest: ${manifest.files.length} files, root ${manifest.rootHash.slice(0, 12)}`);
}
