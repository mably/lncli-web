module.exports = (app) => {
  app.service('lncli', ['$rootScope', '$filter', '$http', '$timeout', '$interval', '$q', 'ngToast', 'bootbox', 'localStorageService', 'jQuery', 'config', 'uuid', 'webNotification', 'iosocket', 'lnwebcliUtils', require('./lncli')]);
};
