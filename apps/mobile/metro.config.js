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

// 3. Keep hierarchical lookup ON. Bun's package store (node_modules/.bun/<pkg>@<ver>+<hash>/)
//    nests each package's own peer deps as siblings inside ITS versioned folder — e.g.
//    react-native-gesture-handler's `invariant` import resolves by walking up from
//    gesture-handler's own directory, not from the two roots above. Disabling this breaks
//    resolution of any such nested dependency, which is bun's normal (non-hoisted) layout.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
