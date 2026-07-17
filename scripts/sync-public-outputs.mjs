import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT } from "./lib.mjs";

for (const directory of ["reports", "pdf"]) {
  const source = resolve(ROOT, "output", directory);
  const destination = resolve(ROOT, "public", directory);
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  if (!existsSync(source)) continue;
  for (const name of readdirSync(source)) cpSync(resolve(source, name), resolve(destination, name));
  console.log(`Synced output/${directory} to public/${directory}`);
}
