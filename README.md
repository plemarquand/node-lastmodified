lastmodified
========

Node.js module to check if a file has been modified on disk since you last checked.

```js
var lastmodified = require('lastmodified');

// create a new lastmodified object, passing a base path to prepend to filenames
var modified = lastmodified(__dirname);

modified.sinceLastCall("foo.js", function(err, wasModified){
  if(wasModified) {
    // minify your JS!
    // reprime your cache!
    // preprocess your CSS!
  }
});

```

Originally developed to help create efficient build scripts where only files that have changed since the last build are processed, lastmodified is useful in any situation where files are changing on disk while your app is running.

Checks persist across application executions, so even if you check if a file has been modified, restart your app and then check again it will return the correct status.

## Installation

	$ npm install lastmodified

## API Quick Start

Filtering a list of files, returning only the modified ones.

```js
modified.filter(["foo.js", "bar.js", "baz.js"], function(err, modifiedFiles){
  modifiedFiles.forEach(file) { 
    // perform a task on the changed file.
  }
});

```

Setting a base path that is prepended to all file names. It's best if you use an absolute base path.

```js
modified.setBasePath(__dirname + "/www/");
```

The last time you checked is persisted across application executions in a flat file. You can maintain multiple flat file lookups by passing in the id parameter to the lastmodified constructor. This is useful if you have two submodules in your program that you dont want to interfere with each other.

```js
var cssModified = lastmodified(__dirname, 'cssfiles');
var jsModified = lastmodified(__dirname, 'jsfiles');
```

You can purge the flat file lookup with purgeAll.

```js
var cssModified = lastmodified(__dirname, 'cssfiles');
cssModified.purgeAll(function(err){
	cssModified.sinceLastCall('foo.css', function(err, wasModified){
		// wasModified is true
	});
});
```

You can ensure the flat file lookup is saved to disk with serialize. This is useful to do manually in certain situations, because if your application crashes the lookup will not be saved automatically.

```js
var cssModified = lastmodified(__dirname, 'cssfiles');
cssModified.serialize(function(err){
	// cssfiles lookup saved, next time the applcation runs check state will be restored to this point.
});
```
