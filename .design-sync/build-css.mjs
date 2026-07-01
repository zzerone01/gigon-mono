// Compiles .design-sync/tailwind-input.css -> .design-sync/gigon.compiled.css
// using apps/web's own Tailwind v4 (@tailwindcss/postcss), so the bundle ships
// the exact tokens + utilities the app uses. Re-run before each design-sync
// build (wired as cfg.buildCmd).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const here = import.meta.dirname;
const repo = resolve(here, "..");
const req = createRequire(resolve(repo, "apps/web/package.json"));
const postcss = req("postcss");
const tailwindcss = req("@tailwindcss/postcss");

const input = resolve(here, "tailwind-input.css");
const output = resolve(here, "gigon.compiled.css");
const css = readFileSync(input, "utf8");

const result = await postcss([tailwindcss()]).process(css, {
  from: input,
  to: output,
});
writeFileSync(output, result.css);
console.error(`build-css: wrote ${output} (${(result.css.length / 1024).toFixed(0)} KB)`);
