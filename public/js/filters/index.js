module.exports = function (app) {
  app.filter('firstlast', [require('./firstlast')]);
};
