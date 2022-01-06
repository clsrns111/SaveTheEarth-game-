"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mapVisitor = mapVisitor;
exports.default = exports.ALL_EDGE_TYPES = void 0;

var _types = require("./types");

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function () {
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

const ALL_EDGE_TYPES = '@@all_edge_types';
exports.ALL_EDGE_TYPES = ALL_EDGE_TYPES;

class Graph {
  nextNodeId = 1;

  constructor(opts) {
    var _opts$nextNodeId;

    this.nodes = (opts === null || opts === void 0 ? void 0 : opts.nodes) || new Map();
    this.setRootNodeId(opts === null || opts === void 0 ? void 0 : opts.rootNodeId);
    this.nextNodeId = (_opts$nextNodeId = opts === null || opts === void 0 ? void 0 : opts.nextNodeId) !== null && _opts$nextNodeId !== void 0 ? _opts$nextNodeId : 0;
    let edges = opts === null || opts === void 0 ? void 0 : opts.edges;

    if (edges != null) {
      this.inboundEdges = new AdjacencyList();
      this.outboundEdges = new AdjacencyList(edges);

      for (let [from, edgeList] of edges) {
        for (let [type, toNodes] of edgeList) {
          for (let to of toNodes) {
            this.inboundEdges.addEdge(to, from, type);
          }
        }
      }
    } else {
      this.inboundEdges = new AdjacencyList();
      this.outboundEdges = new AdjacencyList();
    }
  }

  setRootNodeId(id) {
    this.rootNodeId = id;
  }

  static deserialize(opts) {
    return new this({
      nodes: opts.nodes,
      edges: opts.edges,
      rootNodeId: opts.rootNodeId,
      nextNodeId: opts.nextNodeId
    });
  }

  serialize() {
    return {
      nodes: this.nodes,
      edges: this.outboundEdges.getListMap(),
      rootNodeId: this.rootNodeId,
      nextNodeId: this.nextNodeId
    };
  } // Returns a list of all edges in the graph. This can be large, so iterating
  // the complete list can be costly in large graphs. Used when merging graphs.


  getAllEdges() {
    let edges = [];

    for (let [from, edgeList] of this.outboundEdges.getListMap()) {
      for (let [type, toNodes] of edgeList) {
        for (let to of toNodes) {
          edges.push({
            from,
            to,
            type
          });
        }
      }
    }

    return edges;
  }

  addNode(node) {
    let id = (0, _types.toNodeId)(this.nextNodeId++);
    this.nodes.set(id, node);
    return id;
  }

  hasNode(id) {
    return this.nodes.has(id);
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  addEdge(from, to, type = 1) {
    if (!this.getNode(from)) {
      throw new Error(`"from" node '${(0, _types.fromNodeId)(from)}' not found`);
    }

    if (!this.getNode(to)) {
      throw new Error(`"to" node '${(0, _types.fromNodeId)(to)}' not found`);
    }

    this.outboundEdges.addEdge(from, to, type);
    this.inboundEdges.addEdge(to, from, type);
  }

  hasEdge(from, to, type = 1) {
    return this.outboundEdges.hasEdge(from, to, type);
  }

  getNodeIdsConnectedTo(nodeId, type = 1) {
    this._assertHasNodeId(nodeId);

    let inboundByType = this.inboundEdges.getEdgesByType(nodeId);

    if (inboundByType == null) {
      return [];
    }

    let nodes;

    if (type === ALL_EDGE_TYPES) {
      nodes = new Set();

      for (let [, typeNodes] of inboundByType) {
        for (let node of typeNodes) {
          nodes.add(node);
        }
      }
    } else if (Array.isArray(type)) {
      nodes = new Set();

      for (let typeName of type) {
        for (let node of (_inboundByType$get$va = (_inboundByType$get = inboundByType.get(typeName)) === null || _inboundByType$get === void 0 ? void 0 : _inboundByType$get.values()) !== null && _inboundByType$get$va !== void 0 ? _inboundByType$get$va : []) {
          var _inboundByType$get$va, _inboundByType$get;

          nodes.add(node);
        }
      }
    } else {
      var _inboundByType$get$va2, _inboundByType$get2;

      nodes = new Set((_inboundByType$get$va2 = (_inboundByType$get2 = inboundByType.get(type)) === null || _inboundByType$get2 === void 0 ? void 0 : _inboundByType$get2.values()) !== null && _inboundByType$get$va2 !== void 0 ? _inboundByType$get$va2 : []);
    }

    return [...nodes];
  }

  getNodeIdsConnectedFrom(nodeId, type = 1) {
    this._assertHasNodeId(nodeId);

    let outboundByType = this.outboundEdges.getEdgesByType(nodeId);

    if (outboundByType == null) {
      return [];
    }

    let nodes;

    if (type === ALL_EDGE_TYPES) {
      nodes = new Set();

      for (let [, typeNodes] of outboundByType) {
        for (let node of typeNodes) {
          nodes.add(node);
        }
      }
    } else if (Array.isArray(type)) {
      nodes = new Set();

      for (let typeName of type) {
        for (let node of (_outboundByType$get$v = (_outboundByType$get = outboundByType.get(typeName)) === null || _outboundByType$get === void 0 ? void 0 : _outboundByType$get.values()) !== null && _outboundByType$get$v !== void 0 ? _outboundByType$get$v : []) {
          var _outboundByType$get$v, _outboundByType$get;

          nodes.add(node);
        }
      }
    } else {
      var _outboundByType$get$v2, _outboundByType$get2;

      nodes = new Set((_outboundByType$get$v2 = (_outboundByType$get2 = outboundByType.get(type)) === null || _outboundByType$get2 === void 0 ? void 0 : _outboundByType$get2.values()) !== null && _outboundByType$get$v2 !== void 0 ? _outboundByType$get$v2 : []);
    }

    return [...nodes];
  } // Removes node and any edges coming from or to that node


  removeNode(nodeId) {
    this._assertHasNodeId(nodeId);

    for (let [type, nodesForType] of this.inboundEdges.getEdgesByType(nodeId)) {
      for (let from of nodesForType) {
        this.removeEdge(from, nodeId, type, // Do not allow orphans to be removed as this node could be one
        // and is already being removed.
        false
        /* removeOrphans */
        );
      }
    }

    for (let [type, toNodes] of this.outboundEdges.getEdgesByType(nodeId)) {
      for (let to of toNodes) {
        this.removeEdge(nodeId, to, type);
      }
    }

    let wasRemoved = this.nodes.delete(nodeId);
    (0, _assert().default)(wasRemoved);
  }

  removeEdges(nodeId, type = 1) {
    this._assertHasNodeId(nodeId);

    for (let to of this.outboundEdges.getEdges(nodeId, type)) {
      this.removeEdge(nodeId, to, type);
    }
  } // Removes edge and node the edge is to if the node is orphaned


  removeEdge(from, to, type = 1, removeOrphans = true) {
    if (!this.outboundEdges.hasEdge(from, to, type)) {
      throw new Error(`Outbound edge from ${(0, _types.fromNodeId)(from)} to ${(0, _types.fromNodeId)(to)} not found!`);
    }

    if (!this.inboundEdges.hasEdge(to, from, type)) {
      throw new Error(`Inbound edge from ${(0, _types.fromNodeId)(to)} to ${(0, _types.fromNodeId)(from)} not found!`);
    }

    this.outboundEdges.removeEdge(from, to, type);
    this.inboundEdges.removeEdge(to, from, type);

    if (removeOrphans && this.isOrphanedNode(to)) {
      this.removeNode(to);
    }
  }

  isOrphanedNode(nodeId) {
    this._assertHasNodeId(nodeId);

    if (this.rootNodeId == null) {
      // If the graph does not have a root, and there are inbound edges,
      // this node should not be considered orphaned.
      // return false;
      for (let [, inboundNodeIds] of this.inboundEdges.getEdgesByType(nodeId)) {
        if (inboundNodeIds.size > 0) {
          return false;
        }
      }

      return true;
    } // Otherwise, attempt to traverse backwards to the root. If there is a path,
    // then this is not an orphaned node.


    let hasPathToRoot = false; // go back to traverseAncestors

    this.traverseAncestors(nodeId, (ancestorId, _, actions) => {
      if (ancestorId === this.rootNodeId) {
        hasPathToRoot = true;
        actions.stop();
      }
    }, // $FlowFixMe
    ALL_EDGE_TYPES);

    if (hasPathToRoot) {
      return false;
    }

    return true;
  }

  updateNode(nodeId, node) {
    this._assertHasNodeId(nodeId);

    this.nodes.set(nodeId, node);
  }

  replaceNode(fromNodeId, toNodeId, type = 1) {
    this._assertHasNodeId(fromNodeId);

    for (let parent of this.inboundEdges.getEdges(fromNodeId, type)) {
      this.addEdge(parent, toNodeId, type);
      this.removeEdge(parent, fromNodeId, type);
    }

    this.removeNode(fromNodeId);
  } // Update a node's downstream nodes making sure to prune any orphaned branches


  replaceNodeIdsConnectedTo(fromNodeId, toNodeIds, replaceFilter, type = 1) {
    this._assertHasNodeId(fromNodeId);

    let outboundEdges = this.outboundEdges.getEdges(fromNodeId, type);
    let childrenToRemove = new Set(replaceFilter ? [...outboundEdges].filter(toNodeId => replaceFilter(toNodeId)) : outboundEdges);

    for (let toNodeId of toNodeIds) {
      childrenToRemove.delete(toNodeId);

      if (!this.hasEdge(fromNodeId, toNodeId, type)) {
        this.addEdge(fromNodeId, toNodeId, type);
      }
    }

    for (let child of childrenToRemove) {
      this.removeEdge(fromNodeId, child, type);
    }
  }

  traverse(visit, startNodeId, type = 1) {
    return this.dfs({
      visit,
      startNodeId,
      getChildren: nodeId => this.getNodeIdsConnectedFrom(nodeId, type)
    });
  }

  filteredTraverse(filter, visit, startNodeId, type) {
    return this.traverse(mapVisitor(filter, visit), startNodeId, type);
  }

  traverseAncestors(startNodeId, visit, type = 1) {
    return this.dfs({
      visit,
      startNodeId,
      getChildren: nodeId => this.getNodeIdsConnectedTo(nodeId, type)
    });
  }

  dfs({
    visit,
    startNodeId,
    getChildren
  }) {
    let traversalStartNode = (0, _nullthrows().default)(startNodeId !== null && startNodeId !== void 0 ? startNodeId : this.rootNodeId, 'A start node is required to traverse');

    this._assertHasNodeId(traversalStartNode);

    let visited = new Set();
    let stopped = false;
    let skipped = false;
    let actions = {
      skipChildren() {
        skipped = true;
      },

      stop() {
        stopped = true;
      }

    };

    let walk = (nodeId, context) => {
      if (!this.hasNode(nodeId)) return;
      visited.add(nodeId);
      skipped = false;
      let enter = typeof visit === 'function' ? visit : visit.enter;

      if (enter) {
        let newContext = enter(nodeId, context, actions);

        if (typeof newContext !== 'undefined') {
          // $FlowFixMe[reassign-const]
          context = newContext;
        }
      }

      if (skipped) {
        return;
      }

      if (stopped) {
        return context;
      }

      for (let child of getChildren(nodeId)) {
        if (visited.has(child)) {
          continue;
        }

        visited.add(child);
        let result = walk(child, context);

        if (stopped) {
          return result;
        }
      }

      if (typeof visit !== 'function' && visit.exit && // Make sure the graph still has the node: it may have been removed between enter and exit
      this.hasNode(nodeId)) {
        let newContext = visit.exit(nodeId, context, actions);

        if (typeof newContext !== 'undefined') {
          // $FlowFixMe[reassign-const]
          context = newContext;
        }
      }

      if (skipped) {
        return;
      }

      if (stopped) {
        return context;
      }
    };

    return walk(traversalStartNode);
  }

  bfs(visit) {
    let rootNodeId = (0, _nullthrows().default)(this.rootNodeId, 'A root node is required to traverse');
    let queue = [rootNodeId];
    let visited = new Set([rootNodeId]);

    while (queue.length > 0) {
      let node = queue.shift();
      let stop = visit(rootNodeId);

      if (stop === true) {
        return node;
      }

      for (let child of this.getNodeIdsConnectedFrom(node)) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }
    }

    return null;
  }

  findAncestor(nodeId, fn) {
    let res = null;
    this.traverseAncestors(nodeId, (nodeId, ctx, traversal) => {
      if (fn(nodeId)) {
        res = nodeId;
        traversal.stop();
      }
    });
    return res;
  }

  findAncestors(nodeId, fn) {
    let res = [];
    this.traverseAncestors(nodeId, (nodeId, ctx, traversal) => {
      if (fn(nodeId)) {
        res.push(nodeId);
        traversal.skipChildren();
      }
    });
    return res;
  }

  findDescendant(nodeId, fn) {
    let res = null;
    this.traverse((nodeId, ctx, traversal) => {
      if (fn(nodeId)) {
        res = nodeId;
        traversal.stop();
      }
    }, nodeId);
    return res;
  }

  findDescendants(nodeId, fn) {
    let res = [];
    this.traverse((nodeId, ctx, traversal) => {
      if (fn(nodeId)) {
        res.push(nodeId);
        traversal.skipChildren();
      }
    }, nodeId);
    return res;
  }

  _assertHasNodeId(nodeId) {
    if (!this.hasNode(nodeId)) {
      throw new Error('Does not have node ' + (0, _types.fromNodeId)(nodeId));
    }
  }

}

exports.default = Graph;

function mapVisitor(filter, visit) {
  function makeEnter(visit) {
    return function (nodeId, context, actions) {
      let value = filter(nodeId, actions);

      if (value != null) {
        return visit(value, context, actions);
      }
    };
  }

  if (typeof visit === 'function') {
    return makeEnter(visit);
  }

  let mapped = {};

  if (visit.enter != null) {
    mapped.enter = makeEnter(visit.enter);
  }

  if (visit.exit != null) {
    mapped.exit = function (nodeId, context, actions) {
      let exit = visit.exit;

      if (!exit) {
        return;
      }

      let value = filter(nodeId, actions);

      if (value != null) {
        return exit(value, context, actions);
      }
    };
  }

  return mapped;
}

class AdjacencyList {
  constructor(listMap) {
    this._listMap = listMap !== null && listMap !== void 0 ? listMap : new Map();
  }

  getListMap() {
    return this._listMap;
  }

  getEdges(from, type) {
    var _this$_listMap$get$ge, _this$_listMap$get;

    return (_this$_listMap$get$ge = (_this$_listMap$get = this._listMap.get(from)) === null || _this$_listMap$get === void 0 ? void 0 : _this$_listMap$get.get(type)) !== null && _this$_listMap$get$ge !== void 0 ? _this$_listMap$get$ge : new Set();
  }

  getEdgesByType(from) {
    var _this$_listMap$get2;

    return (_this$_listMap$get2 = this._listMap.get(from)) !== null && _this$_listMap$get2 !== void 0 ? _this$_listMap$get2 : new Map();
  }

  hasEdge(from, to, type) {
    var _this$_listMap$get3, _this$_listMap$get3$g;

    return Boolean((_this$_listMap$get3 = this._listMap.get(from)) === null || _this$_listMap$get3 === void 0 ? void 0 : (_this$_listMap$get3$g = _this$_listMap$get3.get(type)) === null || _this$_listMap$get3$g === void 0 ? void 0 : _this$_listMap$get3$g.has(to));
  }

  addEdge(from, to, type) {
    let types = this._listMap.get(from);

    if (types == null) {
      types = new Map();

      this._listMap.set(from, types);
    }

    let adjacent = types.get(type);

    if (adjacent == null) {
      adjacent = new Set();
      types.set(type, adjacent);
    }

    adjacent.add(to);
  }

  removeEdge(from, to, type) {
    var _this$_listMap$get4, _this$_listMap$get4$g;

    (_this$_listMap$get4 = this._listMap.get(from)) === null || _this$_listMap$get4 === void 0 ? void 0 : (_this$_listMap$get4$g = _this$_listMap$get4.get(type)) === null || _this$_listMap$get4$g === void 0 ? void 0 : _this$_listMap$get4$g.delete(to);
  }

}