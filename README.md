# statix (or maybe just sx)

## Component Authors

When writing a component with module with static assets, define your static assets in your module's `package.json` by
adding a "statix" field, whose value should be a set of key/value pairs identifying (1) the name of your asset and (2)
the relative path to your asset from the root of your module directory.

Example:

```json
{
  "name": "myModule",
  "version": "0.1.0",
  "statix": {
    "logo": "./images/logo.png",
    "background": "./images/background-transparent.png"
  }
}
```

Then, as you're developing, simply require `sx` from **statix** and request the name of the asset you're looking for,
namespaced to your module name.

Example:

```js
var sx = require('statix').sx;

var img = document.createElement('img');
img.src = sx('myModule/logo');
document.body.appendChild(img);
```

Notes:

* When developing a module to be consumed by **statix**, make sure you include **statix** *only* as a development dependency. (`npm install --save-dev statix`)
* Any time you add a new asset to your `package.json`, make sure to run `statix` in development mode (`statix --dev`)

By default, `statix --dev` simply copies the `statix` field in your `package.json` into it's own configuration. That is,
with our example above, `sx('myModule/logo')` will resolve to `'images/logo.png'` in development mode. (Maybe I'll let
you prefix that with your own static root)

## Component Consumers

Run `statix` which will write its asset map to ./node_modules/statix/assetMap.json which it will automagically load for
you when you `require('statix')` in your project.
