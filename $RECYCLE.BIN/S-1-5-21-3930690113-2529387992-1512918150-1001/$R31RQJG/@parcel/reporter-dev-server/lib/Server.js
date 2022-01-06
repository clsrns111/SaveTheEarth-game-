"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _url() {
  const data = _interopRequireWildcard(require("url"));

  _url = function () {
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

var _serverErrors = _interopRequireDefault(require("./serverErrors"));

function _fs() {
  const data = _interopRequireDefault(require("fs"));

  _fs = function () {
    return data;
  };

  return data;
}

function _ejs() {
  const data = _interopRequireDefault(require("ejs"));

  _ejs = function () {
    return data;
  };

  return data;
}

function _connect() {
  const data = _interopRequireDefault(require("connect"));

  _connect = function () {
    return data;
  };

  return data;
}

function _serveHandler() {
  const data = _interopRequireDefault(require("serve-handler"));

  _serveHandler = function () {
    return data;
  };

  return data;
}

function _httpProxyMiddleware() {
  const data = require("http-proxy-middleware");

  _httpProxyMiddleware = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Content-Type');
}

const SOURCES_ENDPOINT = '/__parcel_source_root';

const TEMPLATE_404 = _fs().default.readFileSync(_path().default.join(__dirname, 'templates/404.html'), 'utf8');

const TEMPLATE_500 = _fs().default.readFileSync(_path().default.join(__dirname, 'templates/500.html'), 'utf8');

class Server {
  constructor(options) {
    this.options = options;

    try {
      this.rootPath = new (_url().URL)(options.publicUrl).pathname;
    } catch (e) {
      this.rootPath = options.publicUrl;
    }

    this.pending = true;
    this.pendingRequests = [];
    this.bundleGraph = null;
    this.requestBundle = null;
    this.errors = null;
  }

  buildStart() {
    this.pending = true;
  }

  buildSuccess(bundleGraph, requestBundle) {
    this.bundleGraph = bundleGraph;
    this.requestBundle = requestBundle;
    this.errors = null;
    this.pending = false;

    if (this.pendingRequests.length > 0) {
      let pendingRequests = this.pendingRequests;
      this.pendingRequests = [];

      for (let [req, res] of pendingRequests) {
        this.respond(req, res);
      }
    }
  }

  async buildError(options, diagnostics) {
    this.pending = false;
    this.errors = await Promise.all(diagnostics.map(async d => {
      var _d$documentationURL;

      let ansiDiagnostic = await (0, _utils().prettyDiagnostic)(d, options);
      return {
        message: (0, _utils().ansiHtml)(ansiDiagnostic.message),
        stack: ansiDiagnostic.codeframe ? (0, _utils().ansiHtml)(ansiDiagnostic.codeframe) : (0, _utils().ansiHtml)(ansiDiagnostic.stack),
        hints: ansiDiagnostic.hints.map(hint => (0, _utils().ansiHtml)(hint)),
        documentation: (_d$documentationURL = d.documentationURL) !== null && _d$documentationURL !== void 0 ? _d$documentationURL : ''
      };
    }));
  }

  respond(req, res) {
    let {
      pathname
    } = _url().default.parse(req.originalUrl || req.url);

    if (pathname == null) {
      pathname = '/';
    }

    if (this.errors) {
      return this.send500(req, res);
    } else if (_path().default.extname(pathname) === '') {
      // If the URL doesn't start with the public path, or the URL doesn't
      // have a file extension, send the main HTML bundle.
      return this.sendIndex(req, res);
    } else if (pathname.startsWith(SOURCES_ENDPOINT)) {
      req.url = pathname.slice(SOURCES_ENDPOINT.length);
      return this.serve(this.options.inputFS, this.options.projectRoot, req, res, () => this.send404(req, res));
    } else if (pathname.startsWith(this.rootPath)) {
      // Otherwise, serve the file from the dist folder
      req.url = this.rootPath === '/' ? pathname : pathname.slice(this.rootPath.length);

      if (req.url[0] !== '/') {
        req.url = '/' + req.url;
      }

      return this.serveBundle(req, res, () => this.sendIndex(req, res));
    } else {
      return this.send404(req, res);
    }
  }

  sendIndex(req, res) {
    if (this.bundleGraph) {
      // If the main asset is an HTML file, serve it
      let htmlBundleFilePaths = [];
      this.bundleGraph.traverseBundles(bundle => {
        if (bundle.type === 'html' && bundle.bundleBehavior !== 'inline') {
          htmlBundleFilePaths.push(bundle.filePath);
        }
      });
      htmlBundleFilePaths = htmlBundleFilePaths.map(p => {
        return `/${(0, _utils().relativePath)(this.options.distDir, p, false)}`;
      });
      let indexFilePath = null;

      if (htmlBundleFilePaths.length === 1) {
        indexFilePath = htmlBundleFilePaths[0];
      } else {
        indexFilePath = htmlBundleFilePaths.filter(v => {
          let dir = _path().default.posix.dirname(v);

          let withoutExtension = _path().default.posix.basename(v, _path().default.posix.extname(v));

          return withoutExtension === 'index' && req.url.startsWith(dir);
        }).sort((a, b) => {
          return b.length - a.length;
        })[0];
      }

      if (indexFilePath) {
        req.url = indexFilePath;
        this.serveBundle(req, res, () => this.send404(req, res));
      } else {
        this.send404(req, res);
      }
    } else {
      this.send404(req, res);
    }
  }

  async serveBundle(req, res, next) {
    let bundleGraph = this.bundleGraph;

    if (bundleGraph) {
      let {
        pathname
      } = _url().default.parse(req.url);

      if (!pathname) {
        this.send500(req, res);
        return;
      }

      let requestedPath = _path().default.normalize(pathname.slice(1));

      let bundle = bundleGraph.getBundles().find(b => _path().default.relative(this.options.distDir, b.filePath) === requestedPath);

      if (!bundle) {
        this.serveDist(req, res, next);
        return;
      }

      (0, _assert().default)(this.requestBundle != null);

      try {
        await this.requestBundle(bundle);
      } catch (err) {
        this.send500(req, res);
        return;
      }

      this.serveDist(req, res, next);
    } else {
      this.send404(req, res);
    }
  }

  serveDist(req, res, next) {
    return this.serve(this.options.outputFS, this.options.distDir, req, res, next);
  }

  async serve(fs, root, req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // method not allowed
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    try {
      var filePath = _url().default.parse(req.url).pathname || '';
      filePath = decodeURIComponent(filePath);
    } catch (err) {
      return this.sendError(res, 400);
    }

    filePath = _path().default.normalize('.' + _path().default.sep + filePath); // malicious path

    if (filePath.includes(_path().default.sep + '..' + _path().default.sep)) {
      return this.sendError(res, 403);
    } // join / normalize from the root dir


    if (!_path().default.isAbsolute(filePath)) {
      filePath = _path().default.normalize(_path().default.join(root, filePath));
    }

    try {
      var stat = await fs.stat(filePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return next(req, res);
      }

      return this.sendError(res, 500);
    } // Fall back to next handler if not a file


    if (!stat || !stat.isFile()) {
      return next(req, res);
    }

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    return (0, _serveHandler().default)(req, res, {
      public: root,
      cleanUrls: false
    }, {
      lstat: path => fs.stat(path),
      realpath: path => fs.realpath(path),
      createReadStream: (path, options) => fs.createReadStream(path, options),
      readdir: path => fs.readdir(path)
    });
  }

  sendError(res, statusCode) {
    res.statusCode = statusCode;
    setHeaders(res);
    res.end();
  }

  send404(req, res) {
    res.statusCode = 404;
    setHeaders(res);
    res.end(TEMPLATE_404);
  }

  send500(req, res) {
    setHeaders(res);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(500);

    if (this.errors) {
      return res.end(_ejs().default.render(TEMPLATE_500, {
        errors: this.errors
      }));
    }
  }

  logAccessIfVerbose(req) {
    this.options.logger.verbose({
      message: `Request: ${req.headers.host}${req.originalUrl || req.url}`
    });
  }
  /**
   * Load proxy table from package.json and apply them.
   */


  async applyProxyTable(app) {
    // avoid skipping project root
    const fileInRoot = _path().default.join(this.options.projectRoot, '_');

    const pkg = await (0, _utils().loadConfig)(this.options.inputFS, fileInRoot, ['.proxyrc.js', '.proxyrc', '.proxyrc.json'], this.options.projectRoot);

    if (!pkg || !pkg.config || !pkg.files) {
      return this;
    }

    const cfg = pkg.config;

    const filename = _path().default.basename(pkg.files[0].filePath);

    if (filename === '.proxyrc.js') {
      if (typeof cfg !== 'function') {
        this.options.logger.warn({
          message: "Proxy configuration file '.proxyrc.js' should export a function. Skipping..."
        });
        return this;
      }

      cfg(app);
    } else if (filename === '.proxyrc' || filename === '.proxyrc.json') {
      if (typeof cfg !== 'object') {
        this.options.logger.warn({
          message: "Proxy table in '.proxyrc' should be of object type. Skipping..."
        });
        return this;
      }

      for (const [context, options] of Object.entries(cfg)) {
        // each key is interpreted as context, and value as middleware options
        app.use((0, _httpProxyMiddleware().createProxyMiddleware)(context, options));
      }
    }

    return this;
  }

  async start() {
    const app = (0, _connect().default)();
    app.use((req, res, next) => {
      setHeaders(res);
      next();
    });
    await this.applyProxyTable(app);
    app.use((req, res) => {
      this.logAccessIfVerbose(req); // Wait for the parcelInstance to finish bundling if needed

      if (this.pending) {
        this.pendingRequests.push([req, res]);
      } else {
        this.respond(req, res);
      }
    });
    let {
      server,
      stop
    } = await (0, _utils().createHTTPServer)({
      cacheDir: this.options.cacheDir,
      https: this.options.https,
      inputFS: this.options.inputFS,
      listener: app,
      outputFS: this.options.outputFS,
      host: this.options.host
    });
    this.stopServer = stop;
    server.listen(this.options.port, this.options.host);
    return new Promise((resolve, reject) => {
      server.once('error', err => {
        this.options.logger.error({
          message: (0, _serverErrors.default)(err, this.options.port)
        });
        reject(err);
      });
      server.once('listening', () => {
        resolve(server);
      });
    });
  }

  async stop() {
    (0, _assert().default)(this.stopServer != null);
    await this.stopServer();
    this.stopServer = null;
  }

}

exports.default = Server;