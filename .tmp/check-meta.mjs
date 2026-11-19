import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(resolve(ROOT, "project.yaml"), "utf8");

// 模拟 project_field：行首无缩进 key，取冒号后到 # 前，去首尾空白与引号
function projectField(key) {
  for (const line of text.split(/\r?\n/)) {
    if (/^\s/.test(line) || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const name = line.slice(0, i).trim();
    if (name !== key) continue;
    return line.slice(i + 1).split("#")[0].trim().replace(/^"|"$/g, "");
  }
  return "";
}
function imageTag() {
  return projectField("x_image_tag") || projectField("version");
}
function port() {
  return projectField("port") || "8384";
}

const result = {
  version: projectField("version"),
  x_image_tag: projectField("x_image_tag"),
  image_tag: imageTag(),
  port: port(),
  image_ref: `docker.io/syncthing/syncthing:${imageTag()}`,
};
console.log(JSON.stringify(result, null, 2));

const ok =
  result.image_tag === "1.27.0" &&
  result.port === "8384" &&
  result.image_ref === "docker.io/syncthing/syncthing:1.27.0";
console.log(ok ? "\n[OK] 真相源解析符合预期" : "\n[FAIL] 真相源解析异常");
process.exit(ok ? 0 : 1);
