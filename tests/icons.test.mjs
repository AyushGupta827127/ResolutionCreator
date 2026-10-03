// Every `ph:*` icon referenced in the code must exist in the installed Phosphor set,
// otherwise it renders as a blank or a placeholder ring in the UI.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const set = JSON.parse(fs.readFileSync(path.join(root, "node_modules/@iconify-json/ph/icons.json"), "utf8"));
const have = new Set([...Object.keys(set.icons), ...Object.keys(set.aliases || {})]);

const used = new Map();
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".nuxt", ".output", ".git", "tests"].includes(f.name)) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(vue|js|mjs|ts)$/.test(f.name)) {
      const text = fs.readFileSync(p, "utf8");
      for (const m of text.matchAll(/ph:([a-z0-9-]+)/g)) if (!used.has(m[1])) used.set(m[1], path.relative(root, p));
    }
  }
};
walk(root);

const missing = [...used].filter(([name]) => !have.has(name));
console.log(`icons used: ${used.size}, missing: ${missing.length}`);
for (const [name, file] of missing) console.log(`  MISSING ph:${name}  (${file})`);
process.exitCode = missing.length ? 1 : 0;
