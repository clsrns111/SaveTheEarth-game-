"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.load = load;

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _utils() {
  const data = require("@parcel/utils");

  _utils = function () {
    return data;
  };

  return data;
}

function _nullthrows() {
  const data = _interopRequireDefault(require("nullthrows"));

  _nullthrows = function () {
    return data;
  };

  return data;
}

function _clone() {
  const data = _interopRequireDefault(require("clone"));

  _clone = function () {
    return data;
  };

  return data;
}

var _constants = require("./constants");

var _loadPlugins = _interopRequireDefault(require("./loadPlugins"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MODULE_BY_NAME_RE = /\.module\./;

async function configHydrator(configFile, config, resolveFrom, options) {
  // Use a basic, modules-only PostCSS config if the file opts in by a name
  // like foo.module.css
  if (configFile == null && config.searchPath.match(MODULE_BY_NAME_RE)) {
    configFile = {
      plugins: {
        'postcss-modules': {}
      }
    };
    resolveFrom = __filename;
  }

  if (configFile == null) {
    return;
  } // Load the custom config...


  let modulesConfig;
  let configFilePlugins = (0, _clone().default)(configFile.plugins);

  if (configFilePlugins != null && typeof configFilePlugins === 'object' && configFilePlugins['postcss-modules'] != null) {
    modulesConfig = configFilePlugins['postcss-modules'];
    delete configFilePlugins['postcss-modules'];
  }

  if (!modulesConfig && configFile.modules) {
    modulesConfig = {};
  }

  let plugins = await (0, _loadPlugins.default)(configFilePlugins, (0, _nullthrows().default)(resolveFrom), options); // contents is either:
  // from JSON:    { plugins: { 'postcss-foo': { ...opts } } }
  // from JS (v8): { plugins: [ { postcssPlugin: 'postcss-foo', ...visitor callback functions } ]
  // from JS (v7): { plugins: [ [Function: ...] ]

  let pluginArray = Array.isArray(configFilePlugins) ? configFilePlugins : Object.keys(configFilePlugins);

  for (let p of pluginArray) {
    if (typeof p === 'string') {
      config.addDevDependency({
        specifier: p,
        resolveFrom: (0, _nullthrows().default)(resolveFrom)
      });
    }
  }

  return {
    raw: configFile,
    hydrated: {
      plugins,
      from: config.searchPath,
      to: config.searchPath,
      modules: modulesConfig
    }
  };
}

async function load({
  config,
  options,
  logger
}) {
  if (!config.isSource) {
    return;
  }

  let configFile = await config.getConfig(['.postcssrc', '.postcssrc.json', '.postcssrc.js', 'postcss.config.js'], {
    packageKey: 'postcss'
  });
  let contents = null;

  if (configFile) {
    config.addDevDependency({
      specifier: 'postcss',
      resolveFrom: config.searchPath,
      range: _constants.POSTCSS_RANGE
    });
    contents = configFile.contents;
    let isDynamic = configFile && _path().default.extname(configFile.filePath) === '.js';

    if (isDynamic) {
      // We have to invalidate on startup in case the config is non-deterministic,
      // e.g. using unknown environment variables, reading from the filesystem, etc.
      logger.warn({
        message: 'WARNING: Using a JavaScript PostCSS config file means losing out on caching features of Parcel. Use a .postcssrc(.json) file whenever possible.'
      });
      config.invalidateOnStartup(); // Also add the config as a dev dependency so we attempt to reload in watch mode.

      config.addDevDependency({
        specifier: (0, _utils().relativePath)(_path().default.dirname(config.searchPath), configFile.filePath),
        resolveFrom: config.searchPath
      });
    }

    if (typeof contents !== 'object') {
      throw new Error('PostCSS config should be an object.');
    }

    if (contents.plugins == null || typeof contents.plugins !== 'object' || Object.keys(contents.plugins).length === 0) {
      throw new Error('PostCSS config must have plugins');
    }
  }

  return configHydrator(contents, config, configFile === null || configFile === void 0 ? void 0 : configFile.filePath, options);
}