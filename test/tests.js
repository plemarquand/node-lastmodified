var vows = require('vows'),
	path = require('path'),
	fs = require('fs'),
	assert = require('assert');

var suite = vows.describe('lastmodified tests');

var modified = function(id) {
	return require('../lastmodified')(path.resolve(__dirname,'./'), id || "tester", false);
}

suite.addBatch({
	
	'A never before requested file': {
		'should always be modified': {
			'and respond with true': function(err, wasModified) {
				assert.ok(wasModified);
			},
			'and have no error': function(err, wasModified) {
				assert.isNull(err);
			},
			topic: function() {
				var m = modified();
				var cb = this.callback;
				m.purgeAll(function(err) {
					m.since("test.txt", cb);
				});
			}
		}
	},
	
	'A non existant file': {
		'should not be modified': {
			'and respond with false': function(err, wasModified) {
				assert.isUndefined(wasModified);
			},
			'and have an error': function(err, wasModified) {
				assert.ok(err);
			},
			topic: function() {
				var m = modified();
				m.since("test" + new Date().getTime().toString() + ".txt", this.callback);
			}
		}
	},
	'An existing file': {
		'after being queried for once': {
			'should return true': function(err, wasModified){
				assert.isTrue(wasModified);
			},
			'should have no error': function(err, wasModified) {
				assert.isNull(err);
			},
			topic: function() {
				var filename = "newfile.txt";
				var m = modified();
				var cb = this.callback;
				fs.writeFileSync(path.resolve(__dirname, filename), "hallo");
				m.purgeAll(function(err) {
					m.since(filename, cb);
				});
			}
		},
		'after being queried for twice': {
			'should return false': function(err, wasModified){
				assert.isFalse(wasModified);
			},
			'should have no error': function(err, wasModified) {
				assert.isNull(err);
			},
			topic: function() {
				var filename = "newfile.txt";
				var m = modified();
				var cb = this.callback;
				fs.writeFileSync(path.resolve(__dirname, filename), "hallo");
				m.purgeAll(function(err) {
					m.since(filename, function(err, wasModified) {
						m.since(filename, cb);
					});
				});
			}
		}
	},
	'A serialize': {
		'should': {
			'save a file': function() {
				assert.isTrue(fs.existsSync(path.resolve(__dirname, "../toserialize.json")));
				fs.unlinkSync(path.resolve(__dirname, "../toserialize.json"));
			},
			'have no error': function(err) {
				assert.isUndefined(err);
			},
			topic: function() {
				var m = modified("toserialize");
				m.serialize(this.callback);
			}
		}
	},
	'A purge': {
		'should': {
			'remove the file': function() {
				assert.isFalse(fs.existsSync(path.resolve(__dirname, "../topurge.json")));
			}, 
			'have no error': function(err) {
				assert.isUndefined(err);
			}, 
			topic: function() {
				var m = modified("topurge");
				var cb = this.callback;
				m.serialize(function(err) {
					m.purgeAll(cb);
				});
			}
		}
	},
	'A list of newly checked files': {
		'should': {
			'all return as modified': function(err, results) {
				assert.lengthOf(results, 3);
				assert.deepEqual(results, ["test.txt", "test2.txt", "test3.txt"]);
			},
			'return without error': function(err, results) {
				assert.isNull(err);
			},
			topic: function() {
				var m = modified();
				var files = ["test.txt", "test2.txt", "test3.txt"];
				var cb = this.callback;

				m.purgeAll(function(err) {
					m.filter(files, cb);
				});
			}
		}
	},
	'A list of some modified files': {
		'should': {
			'all return as modified': function(err, results) {
				assert.lengthOf(results, 2);
				assert.deepEqual(results, ["test.txt", "test3.txt"]);
			},
			'return without error': function(err, results) {
				assert.isNull(err);
			},
			topic: function() {
				var m = modified();
				var files = ["test.txt", "test2.txt", "test3.txt"];
				var cb = this.callback;

				m.purgeAll(function(err) {
					m.since("test2.txt", function(err, result){
						m.filter(files, cb);
					})
				});
			}
		}
	}
});

suite.export(module);