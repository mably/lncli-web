// app/database.js
var Db = require('tingodb')({ searchInArray: true }).Db;

// expose the routes to our app with module.exports
module.exports = function(dataPath) {

	return new Db(dataPath, {});

}
