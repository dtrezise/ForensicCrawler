import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { auditPackage, canonicalStringify, readJson, sha256, validateJsonSchema, writeJson } from "./lib.mjs";

const input = process.argv[2];
const outputDirectory = process.argv[3];
if (!input || !outputDirectory) {
  throw new Error("Usage: node scripts/export-package.mjs <package.json> <output-directory>");
}

const data = readJson(input);
const audit = auditPackage(data);
if (!audit.valid) throw new Error(`Package audit failed:\n${audit.issues.join("\n")}`);

const absoluteOutput = resolve(outputDirectory);
mkdirSync(absoluteOutput, { recursive: true });
const packageFile = "forensic-package.v1.json";
const packageBytes = canonicalStringify(data);
writeFileSync(resolve(absoluteOutput, packageFile), packageBytes, "utf8");

const manifest = {
  manifestVersion: "1.0.0",
  schemaVersion: data.schemaVersion,
  packageId: data.packageId,
  packageFile,
  packageSha256: sha256(packageBytes),
  generatedBy: "forensic-crawler-export/1.0.0",
  generatedAt: data.exportedAt,
  exportProfile: data.exportProfile,
};
const manifestValidation = validateJsonSchema(manifest, "schemas/v1/export-manifest.schema.json");
if (!manifestValidation.valid) throw new Error(`Export manifest validation failed:\n${manifestValidation.errors.join("\n")}`);
writeJson(resolve(absoluteOutput, "manifest.v1.json"), manifest);
console.log(`Exported ${packageFile} with SHA-256 ${manifest.packageSha256}`);
