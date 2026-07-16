import { auditPackage, readJson } from "./lib.mjs";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/audit-package.mjs <package.json>");

const result = auditPackage(readJson(input));
if (!result.valid) {
  for (const issue of result.issues) console.error(`FAIL ${issue}`);
  process.exitCode = 1;
} else {
  const recordCount = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
  console.log(`PASS package audit: ${recordCount} records, no schema, reference, rights, capture, or audit-chain defects`);
}
