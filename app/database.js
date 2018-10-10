// app/database.js
const Db = require('tingodb')({ searchInArray: true }).Db;

// expose the routes to our app with module.exports
module.exports = function (dataPath) {
  return new Db(dataPath, {});
};
