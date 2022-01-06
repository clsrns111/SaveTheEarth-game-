"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Reporter = exports.Compressor = exports.Optimizer = exports.Packager = exports.Validator = exports.Runtime = exports.Namer = exports.Bundler = exports.Resolver = exports.Transformer = void 0;
const CONFIG = Symbol.for('parcel-plugin-config');

class Transformer {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Transformer = Transformer;

class Resolver {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Resolver = Resolver;

class Bundler {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Bundler = Bundler;

class Namer {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Namer = Namer;

class Runtime {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Runtime = Runtime;

class Validator {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Validator = Validator;

class Packager {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Packager = Packager;

class Optimizer {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Optimizer = Optimizer;

class Compressor {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Compressor = Compressor;

class Reporter {
  constructor(opts) {
    // $FlowFixMe
    this[CONFIG] = opts;
  }

}

exports.Reporter = Reporter;