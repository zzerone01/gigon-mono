import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // next.config.js runs in Node at build time, so allow Node globals there.
    files: ["next.config.js"],
    languageOptions: { globals: { process: "readonly" } },
  },
];
