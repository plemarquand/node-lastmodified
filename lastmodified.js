module.exports = function(basePath, id, saveOnExit) {

	id = id || "lastmodified";
	basePath = basePath || "";

	var api = {};

	var fs = require('fs'),
		path = require('path');

	var dbFile = path.join(__dirname, id + ".json");
	var lookupObj = {};

	process.on('exit', function() {
		// must be synchronous because on exit wont wait
		if(saveOnExit) fs.writeFileSync(dbFile, JSON.stringify(lookupObj.lookup || {}));
	});

	var deserializeTimes = function(callback) {
		fs.readFile(dbFile, 'utf8', function(err, result) {
			if(err) {
				// file hasn't been created yet
				if(err.errno == 34) callback(null, {});
				else callback(err);
			}
			else callback(null, (result) ? (JSON.parse(result)) : {});
		});
	};

	var deserializing = false;
	var deserializedCallbacks = [];

	var getLookup = function(callback) {
		if(lookupObj.lookup === undefined) {
			if(deserializing) {
				deserializedCallbacks.push(callback);
			} else {
				deserializing = true;
				deserializeTimes(function(err, result){
					lookupObj.lookup = result;
					deserializedCallbacks.forEach(function(cb){
						cb(null, lookupObj.lookup);
					});
					deserializing = false;
					deserializedCallbacks = null;
					callback(null, lookupObj.lookup);
				});
			}
		} else {
			callback(null, lookupObj.lookup);
		}
	}

	var wasFileModifiedSince = function(file, lookup, callback) {
		var filepath = path.join(basePath, file);
		var mtime = lookup[filepath];
		fs.stat(filepath, function(err, stats) {
			if(err) callback(err);
			else {
				var now = stats.mtime.getTime();
				var wasModified = now > mtime;
				lookup[filepath] = now
				callback(null, wasModified);
			}
		});
	}

	var fileExists = function(file, callback) {
		var filepath = path.join(basePath, file);
		fs.exists(filepath, function(exists) {
			if(exists) {
				callback(null);
			} else {
				callback(new Error(filepath + " does not exist."));
			}
		});
	}

	var fileHasBeenCheckedFor = function(file, lookup) {
		var filepath = path.join(basePath, file);
		if(lookup.hasOwnProperty(filepath) === false) {
			lookup[filepath] = new Date().getTime();
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Sets the base path that is used to determine the absolute path of
	 * the files passed in for checking
	 */
	api.setBasePath = function(path) {
		basepath = path;
	};

	/**
	 * Given a list of files, determines which of those files have been
	 * modified since the last time they were checked.
	 */
	api.filter = function(files, mtime, callback) {
		if(typeof mtime == 'function') {
			callback = mtime;
			mtime = new Date().getTime();
		}

		var ctr = 0;
		var result = [];
		var exited = false;
		files.forEach(function(file){
			api.since(file, mtime, function(err, wasModified) {
				if(exited) return;
				if(err) {
					exited = true;
					callback(err);
				}
				else {
					ctr++;

					if(wasModified) result.push(file);
					if(ctr == files.length) callback(null, result);
				}
			})
		});
	};

	/**
	 * Callback returns true if the file has changed since the specified time.
	 * If no time is specified, the current time is used.
	 */
	api.since = function(file, mtime, callback) {
		if(typeof mtime == 'function') {
			callback = mtime;
			mtime = new Date().getTime();
		}

		getLookup(function(err, lookup) {
			fileExists(file, function(err) {
				if(err) callback(err);
				else if(fileHasBeenCheckedFor(file, lookup)) {
					wasFileModifiedSince(file, mtime, callback);
				} else {
					callback(err, true);
				}
			});
		});
	};

	/**
	 * Purges a file from the database of last modified files. 
	 * The next check to see if the file has been modified will return true.
	 */
	api.purgeFile = function(file, callback) {
		getLookup(function(err, lookup) {
			var exists = lookup.hasOwnProperty(file);
			delete lookup[file];
			callback(err, exists);
		});
	};

	/**
	 * Removes all files from the database. 
	 * It will also remove the lookup database if one has been created.
	 */
	 api.purgeAll = function(callback) { 
	 	getLookup(function(err, lookup) {
	 		if(err) callback(err);
	 		else {
	 			for (prop in lookup) { 
	 				if (lookup.hasOwnProperty(prop)) { 
	 					delete lookup[prop]; 
	 				} 
	 			}

	 			// finally delete the file if it exists
	 			fs.unlink(dbFile, function (err) {

	 				// dont really care about the error here.
		 			callback();
		 		});
	 		}
	 	});
	 };

	 /**
	  * Saves the lookup of last modified times to disk. Use this to persist
	  * the state of last modified calls across application executions.
	  */
	 api.serialize = function(callback) {
	 	getLookup(function(err, lookup) {
			fs.writeFile(dbFile, JSON.stringify(lookup), function(err) {
				callback(err);
			});
		});
	 }

	return api;
};