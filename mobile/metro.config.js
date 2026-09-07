// Metro config for an Expo app living inside an npm-workspaces monorepo.
// Without this, Metro can't find hoisted node_modules or packages/shared.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// packages/shared is TS source that imports its own siblings with a ".js"
// suffix (the Node-ESM/Vite convention for "bundler" moduleResolution).
// Metro takes that literally, so fall back to extensionless resolution
// (which lets Metro try .ts/.tsx) when the literal .js file doesn't exist.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    if (moduleName.endsWith('.js')) {
      return context.resolveRequest(context, moduleName.slice(0, -3), platform);
    }
    throw error;
  }
};

module.exports = config;
