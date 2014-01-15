/*
current assumptions:

  static assets must all reside in a folder called statics at the root of the
  component. No nested hierarchy for now bc name clash (TODO: this).

  TODO: first point is a problem. Need to establish now to recognize a component
  folder. Simplest way is to force people to prefix their component with
  'react-', but this really isn't react-specific so no. Second would be to check
  all the static folders. A bit slower with false positives but works.

*/

var fs = require('fs-extra');
var glob = require('glob');
var mimetype = require('mimetype');
var path = require('path');
var rework = require('rework');
var reworkNamespace = require('rework-namespace');

var assert = require('assert');
assert = function() {};assert.deepEqual=function() {};
function _getStatics(root) {
  var files = glob.sync(path.join(root, 'node_modules/*'));
  // note that the final output is stored in node_modules/statics/, but nowwhere
  // in the recursive search will such a pattern be possible; therefore, no need
  // to worry about infinite recursion
  var currStatics = glob.sync(path.join(root, 'statics/*'));
  if (!files.length) return currStatics;

  return files.reduce(function(accum, filePath) {
    return accum.concat(_getStatics(filePath));
  }, currStatics);
}

// TODO: clear the asserts
assert.deepEqual(
  _getStatics('./tests'),
  [
    'tests/statics/spinner.css',
    'tests/node_modules/spinner2/statics/spinner.css',
    'tests/node_modules/spinner2/statics/spinner.png',
    'tests/node_modules/treeview/statics/treeview.css',
    'tests/node_modules/treeview/statics/treeview.png',
    'tests/node_modules/treeview/node_modules/react-table/statics/table.css'
  ]
);
assert(_getStatics('./tests').length === 6);

function _extractModuleNameFromPath(modulePath) {
  var relativeModulePath = path.relative(process.cwd(), modulePath);
  var matchedIndex = relativeModulePath.lastIndexOf('statics/');
  var cutPath = relativeModulePath.slice(matchedIndex);
  var asd = /(.+)\/statics\/.+\..+$/.exec(relativeModulePath);
  return asd
    ? asd[1].slice(asd[1].lastIndexOf('/') + 1)
    : path.basename(process.cwd()); // root folder
  // TODO: no need to namespace the root folder's assets.
}

assert(_extractModuleNameFromPath('statics/spinner.css') === 'collect-statics');
assert(_extractModuleNameFromPath('./statics/spinner.css') === 'collect-statics');
assert(_extractModuleNameFromPath('tests/statics/spinner.css') === 'tests');
assert(_extractModuleNameFromPath('tests/node_modules/spinner2/statics/spinner.css') === 'spinner2');
assert(_extractModuleNameFromPath('tests/node_modules/spinner2/statics/spinner.png') === 'spinner2');
assert(_extractModuleNameFromPath('tests/node_modules/treeview/statics/treeview.css') === 'treeview');
assert(_extractModuleNameFromPath('tests/node_modules/treeview/statics/treeview.png') === 'treeview');
assert(_extractModuleNameFromPath('tests/node_modules/treeview/node_modules/react-table/statics/table.css') === 'react-table');

function _extractAssetNameFromPath(assetPath) {
  return path.basename(assetPath);
}

assert(_extractAssetNameFromPath('statics/spinner.css') === 'spinner.css');
assert(_extractAssetNameFromPath('./statics/spinner.css') === 'spinner.css');
assert(_extractAssetNameFromPath('tests/statics/spinner.css') === 'spinner.css');
assert(_extractAssetNameFromPath('tests/node_modules/spinner2/statics/spinner.css') === 'spinner.css');
assert(_extractAssetNameFromPath('tests/node_modules/spinner2/statics/spinner.png') === 'spinner.png');
assert(_extractAssetNameFromPath('tests/node_modules/treeview/statics/treeview.css') === 'treeview.css');
assert(_extractAssetNameFromPath('tests/node_modules/treeview/statics/treeview.png') === 'treeview.png');
assert(_extractAssetNameFromPath('tests/node_modules/treeview/node_modules/react-table/statics/table.css') === 'table.css');

// TODO: anything else?
function _namespaceCSSUrls(src, namespace) {
  return rework(src).use(rework.url(function(url) {
    return namespace + '_' + url;
  })).toString();
}

// TODO: keyframes, media-queries, etc.
function _namespaceCSSSelectors(src, namespace) {
  return rework(src).use(reworkNamespace(namespace + '_')).toString();
}

// TODO: this is a plugin model. This one might always be included by default
function _rewriteCSSByNamespacing(cssPath, namespace) {
  var src = fs.readFileSync(cssPath, {encoding: 'utf8'});
  var newSrc = _namespaceCSSUrls(src, namespace);
  var newSrc2 = _namespaceCSSSelectors(newSrc, namespace);
  fs.writeFileSync(cssPath, newSrc2, {encoding: 'utf8'});
}

// TODO: in the end, it's possible that 2 components require react-spinner,
// which is troublesome especially if the two versions are different. `npm
// dedupe` won't help here; we'll see...
function collectStatic(entryPoint, next) {
  var destFolder = path.join(entryPoint, 'node_modules/statics');
  fs.removeSync(destFolder);
  fs.mkdirpSync(destFolder);

  _getStatics(entryPoint).forEach(function(staticPath) {
    var moduleName = _extractModuleNameFromPath(staticPath);
    var staticName = _extractAssetNameFromPath(staticPath);

    var destPath = path.join(destFolder,  moduleName + '_' + staticName);
    if (mimetype.lookup(staticPath) === 'text/css') {
      // format: react-spinner_bar.css
      fs.copySync(staticPath, destPath);
      _rewriteCSSByNamespacing(destPath, moduleName);
    } else {
      // img copying too expensive; symlink them
      fs.symlinkSync(path.resolve(staticPath), destPath);
    }
  });

  next && next();
}

module.exports = collectStatic;
