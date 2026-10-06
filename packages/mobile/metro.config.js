const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const localPackages = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [packageName, packagePath] of Object.entries(localPackages)) {
    if (moduleName === packageName || moduleName.startsWith(`${packageName}/`)) {
      const subpath = moduleName.slice(packageName.length);
      const resolvedPath = path.join(packagePath, subpath);
      return context.resolveRequest(context, resolvedPath, platform);
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;