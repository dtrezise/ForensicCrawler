import { readJson, sealAuditEvents, writeJson } from "./lib.mjs";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/seal-audit-log.mjs <package.json>");

const data = readJson(input);
data.auditEvents = sealAuditEvents(data.auditEvents);
writeJson(input, data);
console.log(`Sealed ${data.auditEvents.length} audit events in ${input}`);
