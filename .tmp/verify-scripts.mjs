import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "build/project-meta.sh",
  "build/preflight.sh",
  "build/assemble.sh",
  "build/build-all.sh",
  "build/export-images.sh",
];

const errors = [];
for (const rel of FILES) {
  const buf = readFileSync(resolve(ROOT, rel));
  const text = buf.toString("utf8");
  const crlf = (text.match(/\r\n/g) || []).length;
  if (crlf) errors.push(`${rel}: 含 ${crlf} 处 CRLF 行尾（bash heredoc 会出错）`);

  const starts = (text.match(/<<'PY'/g) || []).length;
  const ends = (text.match(/^PY$/gm) || []).length;
  if (starts !== ends) errors.push(`${rel}: heredoc 起点 ${starts} != 终点 ${ends}`);

  text.split("\n").forEach((line, i) => {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith("#") && (line.match(/"/g) || []).length % 2 !== 0) {
      errors.push(`${rel}:${i + 1}: 双引号数量为奇数 -> ${trimmed}`);
    }
  });

  console.log(`CHECKED ${rel}: lines=${text.split("\n").length}, heredoc=${starts}/${ends}, crlf=${crlf}`);
}

if (errors.length) {
  console.log("\n[FAIL] 发现问题:");
  errors.forEach((e) => console.log("  -", e));
  process.exit(1);
}
console.log("\n[OK] 静态检查全部通过");
