import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tpl = readFileSync(resolve(ROOT, "build/docker-compose.yaml.tpl"), "utf8");

const IMAGE_TAG = "docker.io/syncthing/syncthing:1.27.0";
const GUI_PORT = "8384";
const rendered = tpl
  .replace(/\$\{SYNCTHING_IMAGE\}/g, IMAGE_TAG)
  .replace(/\$\{SYNCTHING_PORT\}/g, GUI_PORT);

const hasPlaceholder = /\$\{SYNCTHING_IMAGE\}|\$\{SYNCTHING_PORT\}/.test(rendered);
const imageLine = rendered.split(/\r?\n/).find((l) => l.includes("image:"))?.trim();
const portLine = rendered.split(/\r?\n/).find((l) => l.includes(":8384"))?.trim();

console.log("image line:", imageLine);
console.log("port line :", portLine);
console.log("placeholder remaining:", hasPlaceholder);

const ok =
  !hasPlaceholder &&
  imageLine === `image: ${IMAGE_TAG}` &&
  portLine === `- ${GUI_PORT}:8384`;
console.log(ok ? "\n[OK] compose 渲染符合预期" : "\n[FAIL] compose 渲染异常");
process.exit(ok ? 0 : 1);
