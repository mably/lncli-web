// config/log.js

const winston = require('winston');
require('winston-daily-rotate-file');

module.exports = function (logFileName, logLevel) {
  winston.cli();

  winston.level = logLevel;

  winston.add(winston.transports.DailyRotateFile, {
    filename: logFileName,
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    json: false,
    maxSize: 1000000,
    maxFiles: 7,
    level: logLevel,
  });

  return winston;
};
