module.exports = (app) => {
  app.filter('firstlast', [require('./firstlast')]);
};
