"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "toNodeId", {
  enumerable: true,
  get: function () {
    return _types.toNodeId;
  }
});
Object.defineProperty(exports, "fromNodeId", {
  enumerable: true,
  get: function () {
    return _types.fromNodeId;
  }
});
Object.defineProperty(exports, "Graph", {
  enumerable: true,
  get: function () {
    return _Graph.default;
  }
});
Object.defineProperty(exports, "ALL_EDGE_TYPES", {
  enumerable: true,
  get: function () {
    return _Graph.ALL_EDGE_TYPES;
  }
});
Object.defineProperty(exports, "GraphOpts", {
  enumerable: true,
  get: function () {
    return _Graph.GraphOpts;
  }
});
Object.defineProperty(exports, "mapVisitor", {
  enumerable: true,
  get: function () {
    return _Graph.mapVisitor;
  }
});
Object.defineProperty(exports, "ContentGraph", {
  enumerable: true,
  get: function () {
    return _ContentGraph.default;
  }
});
Object.defineProperty(exports, "SerializedContentGraph", {
  enumerable: true,
  get: function () {
    return _ContentGraph.SerializedContentGraph;
  }
});

var _types = require("./types");

var _Graph = _interopRequireWildcard(require("./Graph"));

var _ContentGraph = _interopRequireWildcard(require("./ContentGraph"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }