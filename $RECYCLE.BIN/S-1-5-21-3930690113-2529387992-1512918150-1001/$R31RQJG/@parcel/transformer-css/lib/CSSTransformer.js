"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _sourceMap() {
  const data = _interopRequireDefault(require("@parcel/source-map"));

  _sourceMap = function () {
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

function _postcssValueParser() {
  const data = _interopRequireDefault(require("postcss-value-parser"));

  _postcssValueParser = function () {
    return data;
  };

  return data;
}

function _semver() {
  const data = _interopRequireDefault(require("semver"));

  _semver = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const URL_RE = /url\s*\("?(?![a-z]+:)/;
const IMPORT_RE = /@import/;

function canHaveDependencies(filePath, code) {
  return !/\.css$/.test(filePath) || IMPORT_RE.test(code) || URL_RE.test(code);
}

var _default = new (_plugin().Transformer)({
  canReuseAST({
    ast
  }) {
    return ast.type === 'postcss' && _semver().default.satisfies(ast.version, '^8.2.1');
  },

  async parse({
    asset
  }) {
    // This is set by other transformers (e.g. Stylus) to indicate that it has already processed
    // all dependencies, and that the CSS transformer can skip this asset completely. This is
    // required because when stylus processes e.g. url() it replaces them with a dependency id
    // to be filled in later. When the CSS transformer runs, it would pick that up and try to
    // resolve a dependency for the id which obviously doesn't exist. Also, it's faster to do
    // it this way since the resulting CSS doesn't need to be re-parsed.
    if (asset.meta.hasDependencies === false) {
      return null;
    }

    let code = await asset.getCode();

    if (code != null && !canHaveDependencies(asset.filePath, code)) {
      return null;
    }

    return {
      type: 'postcss',
      version: '8.2.1',
      program: _postcss().default.parse(code, {
        from: asset.filePath
      }).toJSON()
    };
  },

  async transform({
    asset
  }) {
    // Normalize the asset's environment so that properties that only affect JS don't cause CSS to be duplicated.
    // For example, with ESModule and CommonJS targets, only a single shared CSS bundle should be produced.
    asset.setEnvironment({
      context: 'browser',
      engines: {
        browsers: asset.env.engines.browsers
      },
      shouldOptimize: asset.env.shouldOptimize,
      sourceMap: asset.env.sourceMap
    }); // Check for `hasDependencies` being false here as well, as it's possible
    // another transformer (such as PostCSSTransformer) has already parsed an
    // ast and CSSTransformer's parse was never called.

    let ast = await asset.getAST();

    if (!ast || asset.meta.hasDependencies === false) {
      return [asset];
    }

    let program = _postcss().default.fromJSON(ast.program);

    let originalSourceMap = await asset.getMap();

    let createLoc = (start, specifier, lineOffset, colOffset) => {
      let loc = (0, _utils().createDependencyLocation)(start, specifier, lineOffset, colOffset);

      if (originalSourceMap) {
        loc = (0, _utils().remapSourceLocation)(loc, originalSourceMap);
      }

      return loc;
    };

    let isDirty = false;
    program.walkAtRules('import', rule => {
      let params = (0, _postcssValueParser().default)(rule.params);
      let [name, ...media] = params.nodes;
      let specifier;

      if (name.type === 'function' && name.value === 'url' && name.nodes.length) {
        name = name.nodes[0];
      }

      specifier = name.value;

      if (!specifier) {
        throw new Error('Could not find import name for ' + String(rule));
      } // If this came from an inline <style> tag, don't inline the imported file. Replace with the correct URL instead.
      // TODO: run CSSPackager on inline style tags.
      // let inlineHTML =
      //   this.options.rendition && this.options.rendition.inlineHTML;
      // if (inlineHTML) {
      //   name.value = asset.addURLDependency(dep, {loc: rule.source.start});
      //   rule.params = params.toString();
      // } else {


      media = _postcssValueParser().default.stringify(media).trim();
      let dep = {
        specifier,
        specifierType: 'url',
        // Offset by 8 as it does not include `@import `
        loc: createLoc((0, _nullthrows().default)(rule.source.start), specifier, 0, 8),
        meta: {
          // For the glob resolver to distinguish between `@import` and other URL dependencies.
          isCSSImport: true,
          media
        }
      };
      asset.addDependency(dep);
      rule.remove(); // }

      isDirty = true;
    });
    program.walkDecls(decl => {
      if (URL_RE.test(decl.value)) {
        let parsed = (0, _postcssValueParser().default)(decl.value);
        let isDeclDirty = false;
        parsed.walk(node => {
          if (node.type === 'function' && node.value === 'url' && node.nodes.length > 0 && !node.nodes[0].value.startsWith('#') // IE's `behavior: url(#default#VML)`
          ) {
              let url = asset.addURLDependency(node.nodes[0].value, {
                loc: decl.source && decl.source.start && createLoc(decl.source.start, node.nodes[0].value, 0, node.nodes[0].sourceIndex)
              });
              isDeclDirty = node.nodes[0].value !== url;
              node.nodes[0].value = url;
            }
        });

        if (isDeclDirty) {
          decl.value = parsed.toString();
          isDirty = true;
        }
      }
    });

    if (isDirty) {
      asset.setAST({ ...ast,
        program: program.toJSON()
      });
    }

    return [asset];
  },

  async generate({
    asset,
    ast,
    options
  }) {
    let result = await (0, _postcss().default)().process(_postcss().default.fromJSON(ast.program), {
      from: undefined,
      to: options.projectRoot + '/index',
      map: {
        annotation: false,
        inline: false,
        sourcesContent: false
      },
      // Pass postcss's own stringifier to it to silence its warning
      // as we don't want to perform any transformations -- only generate
      stringifier: _postcss().default.stringify
    });
    let map = null;
    let originalSourceMap = await asset.getMap();

    if (result.map != null) {
      map = new (_sourceMap().default)(options.projectRoot);
      map.addVLQMap(result.map.toJSON());

      if (originalSourceMap) {
        map.extends(originalSourceMap.toBuffer());
      }
    } else {
      map = originalSourceMap;
    }

    return {
      content: result.css,
      map
    };
  }

});

exports.default = _default;