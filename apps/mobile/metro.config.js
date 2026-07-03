// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so changes in packages/ui are picked up.
config.watchFolders = [workspaceRoot];

// 2. pnpm keeps transitive deps under node_modules/.pnpm and links them via
//    symlinks, so Metro must keep hierarchical lookup ON (it resolves from
//    each module's real path). Only seed the search paths.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Honor "exports" so `@repo/ui/tokens` resolves to the package subpath.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
