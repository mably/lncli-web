// app/database.js
const { Db } = require('tingodb')({ searchInArray: true });

// expose the routes to our app with module.exports
module.exports = function factory(dataPath) {
  return new Db(dataPath, {});
};
