module.exports = {
  "extends": [ "airbnb-base" ],
  "env": {
    "browser": true,
    "node": true,
    "jasmine": true,
  },
  "globals": {
    "angular": true,
  },
  "rules": {
    "no-param-reassign": "off",
    "no-plusplus": [2, { allowForLoopAfterthoughts: true }],
    "no-console": "off",
    "global-require": "off",
  },
};
