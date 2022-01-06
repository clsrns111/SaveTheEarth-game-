"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _sourceMap2() {
  const data = _interopRequireDefault(require("@parcel/source-map"));

  _sourceMap2 = function () {
    return data;
  };

  return data;
}

function _plugin() {
  const data = require("@parcel/plugin");

  _plugin = function () {
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

function _postcss() {
  const data = _interopRequireDefault(require("postcss"));

  _postcss = function () {
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = new (_plugin().Packager)({
  async package({
    bundle,
    bundleGraph,
    getInlineBundleContents,
    getSourceMapReference,
    logger,
    options
  }) {
    let queue = new (_utils().PromiseQueue)({
      maxConcurrent: 32
    });
    let hoistedImports = [];
    bundle.traverse({
      exit: node => {
        if (node.type === 'dependency') {
          // Hoist unresolved external dependencies (i.e. http: imports)
          if (node.value.priority === 'sync' && !bundleGraph.getResolvedAsset(node.value, bundle)) {
            hoistedImports.push(node.value.specifier);
          }

          return;
        }

        let asset = node.value; // Figure out which media types this asset was imported with.
        // We only want to import the asset once, so group them all together.

        let media = [];

        for (let dep of bundleGraph.getIncomingDependencies(asset)) {
          if (!dep.meta.media) {
            // Asset was imported without a media type. Don't wrap in @media.
            media.length = 0;
            break;
          }

          media.push(dep.meta.media);
        }

        queue.add(() => {
          // This condition needs to align with the one in Transformation#runPipeline !
          if (!asset.symbols.isCleared && options.mode === 'production') {
            // a CSS Modules asset
            return processCSSModule(options, logger, bundleGraph, bundle, asset, media);
          } else {
            return Promise.all([asset, asset.getCode().then(css => {
              if (media.length) {
                return `@media ${media.join(', ')} {\n${css}\n}\n`;
              }

              return css;
            }), bundle.env.sourceMap && asset.getMapBuffer()]);
          }
        });
      }
    });
    let outputs = await queue.run();
    let contents = '';
    let map = new (_sourceMap2().default)(options.projectRoot);
    let lineOffset = 0;

    for (let url of hoistedImports) {
      contents += `@import "${url}";\n`;
      lineOffset++;
    }

    for (let [asset, code, mapBuffer] of outputs) {
      contents += code + '\n';

      if (bundle.env.sourceMap) {
        if (mapBuffer) {
          map.addBuffer(mapBuffer, lineOffset);
        } else {
          map.addEmptyMap(_path().default.relative(options.projectRoot, asset.filePath).replace(/\\+/g, '/'), code, lineOffset);
        }

        lineOffset += (0, _utils().countLines)(code);
      }
    }

    if (bundle.env.sourceMap) {
      let reference = await getSourceMapReference(map);

      if (reference != null) {
        contents += '/*# sourceMappingURL=' + reference + ' */\n';
      }
    }

    ({
      contents,
      map
    } = (0, _utils().replaceURLReferences)({
      bundle,
      bundleGraph,
      contents,
      map
    }));
    return (0, _utils().replaceInlineReferences)({
      bundle,
      bundleGraph,
      contents,
      getInlineBundleContents,
      getInlineReplacement: (dep, inlineType, contents) => ({
        from: dep.id,
        to: contents
      }),
      map
    });
  }

});

exports.default = _default;

async function processCSSModule(options, logger, bundleGraph, bundle, asset, media) {
  var _await$asset$getAST, _sourceMap;

  let ast = _postcss().default.fromJSON((0, _nullthrows().default)((_await$asset$getAST = await asset.getAST()) === null || _await$asset$getAST === void 0 ? void 0 : _await$asset$getAST.program));

  let usedSymbols = bundleGraph.getUsedSymbols(asset);

  if (usedSymbols != null) {
    let localSymbols = new Set([...asset.symbols].map(([, {
      local
    }]) => `.${local}`));
    let defaultImport = null;

    if (usedSymbols.has('default')) {
      let incoming = bundleGraph.getIncomingDependencies(asset);
      defaultImport = incoming.find(d => d.symbols.hasExportSymbol('default'));

      if (defaultImport) {
        var _defaultImport$symbol, _loc$filePath;

        let loc = (_defaultImport$symbol = defaultImport.symbols.get('default')) === null || _defaultImport$symbol === void 0 ? void 0 : _defaultImport$symbol.loc;
        logger.warn({
          message: 'CSS modules cannot be tree shaken when imported with a default specifier',
          ...(loc && {
            codeFrames: [{
              filePath: (0, _nullthrows().default)((_loc$filePath = loc === null || loc === void 0 ? void 0 : loc.filePath) !== null && _loc$filePath !== void 0 ? _loc$filePath : defaultImport.sourcePath),
              codeHighlights: [{
                start: loc.start,
                end: loc.end
              }]
            }]
          }),
          hints: [`Instead do: import * as style from "${defaultImport.specifier}";`],
          documentationURL: 'https://parceljs.org/languages/css/#tree-shaking'
        });
      }
    }

    if (!defaultImport && !usedSymbols.has('*')) {
      let usedLocalSymbols = new Set([...usedSymbols].map(exportSymbol => `.${(0, _nullthrows().default)(asset.symbols.get(exportSymbol)).local}`));
      ast.walkRules(rule => {
        if (localSymbols.has(rule.selector) && !usedLocalSymbols.has(rule.selector)) {
          rule.remove();
        }
      });
    }
  }

  let {
    content,
    map
  } = await (0, _postcss().default)().process(ast, {
    from: undefined,
    to: options.projectRoot + '/index',
    map: {
      annotation: false,
      inline: false
    },
    // Pass postcss's own stringifier to it to silence its warning
    // as we don't want to perform any transformations -- only generate
    stringifier: _postcss().default.stringify
  });
  let sourceMap;

  if (bundle.env.sourceMap && map != null) {
    sourceMap = new (_sourceMap2().default)(options.projectRoot);
    sourceMap.addVLQMap(map.toJSON());
  }

  if (media.length) {
    content = `@media ${media.join(', ')} {\n${content}\n}\n`;
  }

  return [asset, content, (_sourceMap = sourceMap) === null || _sourceMap === void 0 ? void 0 : _sourceMap.toBuffer()];
}