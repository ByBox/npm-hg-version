Mercurial support for npm version
=================================
This module tags your Mercurial repository as a result of doing npm
version.

To your package.json, add:

```
  scripts: {
    "preversion": "node ./node_modules/npm-hg-version/hg-version.js",
    "postversion": "node ./node_modules/npm-hg-version/hg-version.js"
  }
```
You can now do `npm version patch && npm publish`.

Note that this module does not exactly mimic the git behaviour in npm
version. In particular, it:

 * refuses to operate on a repository with modifications
 * will not add package.json/npm-shrinkwrap.json for you

If you want to force a tag despite modifications, use `npm version --ignore-modifications`.
This will still bail if `package.json` (or `npm-shrinkwrap.json`) is modified,
so as to stop you from accidentally committing e.g. dependency changes as
a version bump.

