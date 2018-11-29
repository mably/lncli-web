const setAccessControlHeaders = (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
};

module.exports = function factory(req, res, next) {
  if (req.method === 'OPTIONS') {
    setAccessControlHeaders(req, res);
    return res.sendStatus(204);
  }

  setAccessControlHeaders(req, res);
  return next();
};
