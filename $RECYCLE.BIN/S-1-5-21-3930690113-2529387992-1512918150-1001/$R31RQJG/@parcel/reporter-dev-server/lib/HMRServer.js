"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _ws() {
  const data = _interopRequireDefault(require("ws"));

  _ws = function () {
    return data;
  };

  return data;
}

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function () {
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const FS_CONCURRENCY = 64;

class HMRServer {
  unresolvedError = null;

  constructor(options) {
    this.options = options;
  }

  start() {
    this.wss = new (_ws().default.Server)(this.options.devServer ? {
      server: this.options.devServer
    } : {
      port: this.options.port
    });
    this.wss.on('connection', ws => {
      if (this.unresolvedError) {
        ws.send(JSON.stringify(this.unresolvedError));
      }
    }); // $FlowFixMe[incompatible-exact]

    this.wss.on('error', err => this.handleSocketError(err));
    let address = this.wss.address();
    (0, _assert().default)(typeof address === 'object' && address != null);
    return address.port;
  }

  stop() {
    this.wss.close();
  }

  async emitError(options, diagnostics) {
    let renderedDiagnostics = await Promise.all(diagnostics.map(d => (0, _utils().prettyDiagnostic)(d, options))); // store the most recent error so we can notify new connections
    // and so we can broadcast when the error is resolved

    this.unresolvedError = {
      type: 'error',
      diagnostics: {
        ansi: renderedDiagnostics,
        html: renderedDiagnostics.map((d, i) => {
          var _diagnostics$i$docume;

          return {
            message: (0, _utils().ansiHtml)(d.message),
            stack: (0, _utils().ansiHtml)(d.stack),
            codeframe: (0, _utils().ansiHtml)(d.codeframe),
            hints: d.hints.map(hint => (0, _utils().ansiHtml)(hint)),
            documentation: (_diagnostics$i$docume = diagnostics[i].documentationURL) !== null && _diagnostics$i$docume !== void 0 ? _diagnostics$i$docume : ''
          };
        })
      }
    };
    this.broadcast(this.unresolvedError);
  }

  async emitUpdate(event) {
    this.unresolvedError = null;
    let changedAssets = new Set(event.changedAssets.values());
    if (changedAssets.size === 0) return;
    let queue = new (_utils().PromiseQueue)({
      maxConcurrent: FS_CONCURRENCY
    });

    for (let asset of changedAssets) {
      if (asset.type !== 'js') {
        // If all of the incoming dependencies of the asset actually resolve to a JS asset
        // rather than the original, we can mark the runtimes as changed instead. URL runtimes
        // have a cache busting query param added with HMR enabled which will trigger a reload.
        let runtimes = new Set();
        let incomingDeps = event.bundleGraph.getIncomingDependencies(asset);
        let isOnlyReferencedByRuntimes = incomingDeps.every(dep => {
          let resolved = event.bundleGraph.getResolvedAsset(dep);
          let isRuntime = (resolved === null || resolved === void 0 ? void 0 : resolved.type) === 'js' && resolved !== asset;

          if (resolved && isRuntime) {
            runtimes.add(resolved);
          }

          return isRuntime;
        });

        if (isOnlyReferencedByRuntimes) {
          for (let runtime of runtimes) {
            changedAssets.add(runtime);
          }

          continue;
        }
      }

      queue.add(async () => {
        let dependencies = event.bundleGraph.getDependencies(asset);
        let depsByBundle = {};

        for (let bundle of event.bundleGraph.getBundlesWithAsset(asset)) {
          let deps = {};

          for (let dep of dependencies) {
            let resolved = event.bundleGraph.getResolvedAsset(dep, bundle);

            if (resolved) {
              deps[getSpecifier(dep)] = event.bundleGraph.getAssetPublicId(resolved);
            }
          }

          depsByBundle[bundle.id] = deps;
        }

        return {
          id: event.bundleGraph.getAssetPublicId(asset),
          type: asset.type,
          // No need to send the contents of non-JS assets to the client.
          output: asset.type === 'js' ? await asset.getCode() : '',
          envHash: asset.env.id,
          depsByBundle
        };
      });
    }

    let assets = await queue.run();
    this.broadcast({
      type: 'update',
      assets: assets
    });
  }

  handleSocketError(err) {
    if (err.code === 'ECONNRESET') {
      // This gets triggered on page refresh, ignore this
      return;
    }

    this.options.logger.warn({
      origin: '@parcel/reporter-dev-server',
      message: `[${err.code}]: ${err.message}`,
      stack: err.stack
    });
  }

  broadcast(msg) {
    const json = JSON.stringify(msg);

    for (let ws of this.wss.clients) {
      ws.send(json);
    }
  }

}

exports.default = HMRServer;

function getSpecifier(dep) {
  if (typeof dep.meta.placeholder === 'string') {
    return dep.meta.placeholder;
  }

  return dep.specifier;
}