// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// drizzle-kit's expo driver emits migrations.js files that `import` the raw .sql migration
// text — Metro needs to know to bundle .sql as a source extension for that to resolve.
config.resolver.sourceExts.push('sql');

// expo-sqlite's web backend (wa-sqlite/OPFS) imports its engine as a .wasm asset.
config.resolver.assetExts.push('wasm');

module.exports = config;
