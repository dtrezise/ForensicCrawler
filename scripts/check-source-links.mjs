import { readJson } from "./lib.mjs";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/check-source-links.mjs <package.json>");

const data = readJson(input);
const registryById = new Map(data.sourceRegistryEntries.map((entry) => [entry.id, entry]));
const issues = [];

for (const source of data.sources) {
  let url;
  try {
    url = new URL(source.canonicalUrl);
  } catch {
    issues.push(`${source.id}: invalid URL`);
    continue;
  }

  const registry = registryById.get(source.registryEntryId);
  if (!registry) {
    issues.push(`${source.id}: missing registry entry`);
    continue;
  }
  if (url.protocol !== "https:") issues.push(`${source.id}: protocol is not HTTPS`);
  if (url.origin !== new URL(registry.canonicalOrigin).origin) issues.push(`${source.id}: origin is outside registry`);
  if (!registry.allowedPaths.some((path) => url.pathname === path || url.pathname.startsWith(path))) {
    issues.push(`${source.id}: path is outside registry`);
  }
  if (registry.networkUseApproved) issues.push(`${source.id}: fixture registry must not approve network use`);
}

if (issues.length) {
  for (const issue of issues) console.error(`FAIL ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`PASS offline source policy: ${data.sources.length} HTTPS locators match metadata-only registry scope; no network request performed`);
}
