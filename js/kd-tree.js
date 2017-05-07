// Based on https://bl.ocks.org/armollica/64ffc3bd8fc76c5657719a842e39c4e3#kd-tree.js
// Modified by fcortes:
// (30/04/17) Clean up some code

function Node(location, axis, subnodes, datum) {
  this.location = location;
  this.axis = axis;
  this.subnodes = subnodes;  // = children nodes = [left child, right child]
  this.datum = datum;
};

Node.prototype.toArray = function() {
  var array = [
    this.location,
    this.subnodes[0] ? this.subnodes[0].toArray() : null,
    this.subnodes[0] ? this.subnodes[1].toArray() : null
  ];
  array.axis = this.axis;
  return array;
};

Node.prototype.flatten = function() {
  var left = this.subnodes[0] ? this.subnodes[0].flatten() : null,
      right = this.subnodes[1] ? this.subnodes[1].flatten() : null;
  return left && right ? [this].concat(left, right) :
         left ? [this].concat(left) :
         right ? [this].concat(right) :
         [this];
};

// Nearest neighbor search (1-NN)
Node.prototype.find = function(target) {
  var guess = this,
      bestDist = Infinity,
      scannedNodes = [];  // keep track of these just for testing purpose

  search(this);

  return {
    node: guess,
    distance: bestDist,
    scannedNodes: scannedNodes
  };

  // 1-NN algorithm outlined here:
  // http://web.stanford.edu/class/cs106l/handouts/assignment-3-kdtree.pdf
  function search(node) {
    if (node === null) return;

    scannedNodes.push(node);

    // If the current location is better than the best known location,
    // update the best known location
    var nodeDist = distance(node.location, target);
    if (nodeDist < bestDist) {
      bestDist = nodeDist;
      guess = node;
    }

    // Recursively search the half of the tree that contains the target
    var side = target[node.axis] < node.location[node.axis] ? "left" : "right";
    if (side == "left") {
      search(node.subnodes[0]);
      var otherNode = node.subnodes[1];
    }
    else {
      search(node.subnodes[1]);
      var otherNode = node.subnodes[0];
    }

    // If the candidate hypersphere crosses this splitting plane, look on the
    // other side of the plane by examining the other subtree
    if (otherNode !== null) {
      var i = node.axis;
      var delta = Math.abs(node.location[i] - target[i]);
      if (delta < bestDist) {
        search(otherNode);
      }
    }
  }
};

function KDTree() {
  var x = function(d) { return d[0]; },
      y = function(d) { return d[1]; };

  function tree(data) {
    var points = data.map(function(d) {
      var point = [x(d), y(d)];
      point.datum = d;
      return point;
    });

    return treeify(points, 0);
  }

  tree.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    return tree;
  };

  tree.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return tree;
  };

  return tree;

  // Adapted from https://en.wikipedia.org/wiki/K-d_tree
  function treeify(points, depth) {
      try { var dims = points[0].length; }
      catch (e) { return null; }

      // Select axis based on depth so that axis cycles through all valid values
      var axis = depth % dims;

      // TODO: To speed up, consider splitting points based on approximation of
      //       median; take median of random sample of points (perhaps of 1/10th
      //       of the points)

      // Sort point list and choose median as pivot element
      points.sort(function(a, b) { return a[axis] - b[axis]; });
      i_median = Math.floor(points.length / 2);

      // Create node and construct subtrees
      var point = points[i_median],
          left_points = points.slice(0, i_median),
          right_points = points.slice(i_median + 1);

      return new Node(
        point,
        axis,
        [treeify(left_points, depth + 1), treeify(right_points, depth + 1)],
        point.datum
      );
    }
}

function min(array, accessor) {
  return array
    .map(function(d) { return accessor(d); })
    .reduce(function(a, b) { return a < b ? a : b; });
}

function max(array, accessor) {
  return array
    .map(function(d) { return accessor(d); })
    .reduce(function(a, b) { return a > b ? a : b; });
}

function get(key) { return function(d) { return d[key]; }; }

// TODO: Make distance function work for k-dimensions

// Euclidean distance between two 2D points
function distance(p0, p1) {
  return Math.sqrt(Math.pow(p1[0] - p0[0], 2) + Math.pow(p1[1] - p0[1], 2));
}
