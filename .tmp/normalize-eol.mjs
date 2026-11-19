import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "build/assemble.sh",
  "build/build-all.sh",
  "build/export-images.sh",
];

for (const rel of FILES) {
  const p = resolve(ROOT, rel);
  const text = readFileSync(p).toString("utf8");
  const normalized = text.replace(/\r\n/g, "\n");
  if (normalized !== text) {
    writeFileSync(p, normalized, "utf8");
    console.log(`NORMALIZED ${rel}`);
  } else {
    console.log(`UNCHANGED  ${rel}`);
  }
}
