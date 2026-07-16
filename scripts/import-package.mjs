import { auditPackage, readJson, writeJson } from "./lib.mjs";

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error("Usage: node scripts/import-package.mjs <input.json> <canonical-output.json>");

const data = readJson(input);
const audit = auditPackage(data);
if (!audit.valid) throw new Error(`Import rejected:\n${audit.issues.join("\n")}`);
writeJson(output, data);
console.log(`Imported and canonicalized ${input} -> ${output}`);
