
/**
 * Usage:
 * var assetMap = require('path/to/my/assetMap.json');
 * var sx = require('statix').setAssetMap(assetMap).sx;
 *
 * console.log(sx('react-example/logo')); 
 *
 * The above will print the path to the asset
 * identified in the `react-example` component by `logo` under the
 * `statix` field in the package.json.
 *
 * This doesn't quite handle static root definitions, but it also doesn't
 * have to.
 *
 * var CDNPath = config.staticRoot() + sx('react-example/logo');
 *
 * That said, it would be nice for this library to support staticRoot
 * definitions to keep the code clean.
 */

function Statix() {
  this.assetMap = null;
}

Statix.prototype.setAssetMap = function(map) {
  this.assetMap = map;
  return this;
};

Statix.prototype.sx = function(id) {
  return this.assetMap[id];
};

module.exports = new Statix();
