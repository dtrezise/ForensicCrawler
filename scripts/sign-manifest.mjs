import { generateKeyPairSync, sign, verify } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { canonicalStringify, readJson, ROOT, writeJson } from "./lib.mjs";

const manifestInput = process.argv[2];
if (!manifestInput) throw new Error("Usage: node scripts/sign-manifest.mjs <manifest.json>");
const keyDirectory = resolve(ROOT, ".forensic-private");
const privatePath = resolve(keyDirectory, "manifest-ed25519-private.pem");
const publicPath = resolve(keyDirectory, "manifest-ed25519-public.pem");
mkdirSync(keyDirectory, { recursive: true });
if (!existsSync(privatePath)) {
  const pair = generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  writeFileSync(privatePath, pair.privateKey, { mode: 0o600 });
  writeFileSync(publicPath, pair.publicKey, { mode: 0o644 });
}
const manifest = readJson(manifestInput);
const payload = Buffer.from(canonicalStringify({ ...manifest, signature: undefined }));
const privateKey = readFileSync(privatePath, "utf8");
const publicKey = readFileSync(publicPath, "utf8");
const signature = sign(null, payload, privateKey).toString("base64");
if (!verify(null, payload, publicKey, Buffer.from(signature, "base64"))) throw new Error("Local manifest signature verification failed");
manifest.signature = {
  status: "locally_signed_untrusted_identity",
  algorithm: "ed25519",
  publicKey,
  value: signature,
  trustedTimestamp: null,
};
writeJson(manifestInput, manifest);
console.log(`Signed ${manifestInput} with a local project key; no external trust or timestamp is claimed.`);
