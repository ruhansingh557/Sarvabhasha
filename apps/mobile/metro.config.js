// Learn more: https://docs.expo.dev/guides/monorepo/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so changes in packages/* trigger a rebuild.
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from BOTH the app and the workspace root. Bun hoists most
//    deps to the root; without this Metro cannot find them.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Do NOT walk up past the workspace root looking for node_modules.
//    Prevents Metro resolving a stray copy outside the repo.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
