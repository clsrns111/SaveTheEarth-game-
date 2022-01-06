"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LMDBCache = void 0;

function _core() {
  const data = require("@parcel/core");

  _core = function () {
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

var _package = _interopRequireDefault(require("../package.json"));

function _lmdbStore() {
  const data = _interopRequireDefault(require("lmdb-store"));

  _lmdbStore = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// flowlint-next-line untyped-import:off
// $FlowFixMe
class LMDBCache {
  // $FlowFixMe
  constructor(cacheDir) {
    this.dir = cacheDir;
    this.store = _lmdbStore().default.open(cacheDir, {
      name: 'parcel-cache',
      encoding: 'binary',
      compression: true
    });
  }

  ensure() {
    return Promise.resolve();
  }

  serialize() {
    return {
      dir: this.dir
    };
  }

  static deserialize(opts) {
    return new LMDBCache(opts.dir);
  }

  has(key) {
    return Promise.resolve(this.store.get(key) != null);
  }

  get(key) {
    let data = this.store.get(key);

    if (data == null) {
      return Promise.resolve(null);
    }

    return Promise.resolve((0, _core().deserialize)(data));
  }

  async set(key, value) {
    await this.store.put(key, (0, _core().serialize)(value));
  }

  getStream(key) {
    return (0, _utils().blobToStream)(this.store.get(key));
  }

  async setStream(key, stream) {
    let buf = await (0, _utils().bufferStream)(stream);
    await this.store.put(key, buf);
  }

  getBlob(key) {
    let buffer = this.store.get(key);
    return buffer != null ? Promise.resolve(buffer) : Promise.reject(new Error(`Key ${key} not found in cache`));
  }

  async setBlob(key, contents) {
    await this.store.put(key, contents);
  }

  getBuffer(key) {
    return Promise.resolve(this.store.get(key));
  }

}

exports.LMDBCache = LMDBCache;
(0, _core().registerSerializableClass)(`${_package.default.version}:LMDBCache`, LMDBCache);