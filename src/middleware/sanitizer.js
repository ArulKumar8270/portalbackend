exports.sanitize = function (ignore = []) {
  return (req, res, next) => {
    var data = [];
    if (req.body) {
      data = Object.keys(req.body);
      for (var i = 0; i < data.length; i++) {
        if (
          ignore.indexOf(data[i]) == -1 &&
          typeof req.body[data[i]] == "string"
        ) {
          const sanitized = req.sanitize ? req.sanitize(req.body[data[i]]) : req.body[data[i]];
          req.body[data[i]] = (sanitized != null && typeof sanitized === 'string') ? sanitized.trim() : req.body[data[i]];
        }
      }
    }
    if (req.params) {
      data = Object.keys(req.params);
      for (var i = 0; i < data.length; i++) {
        if (
          ignore.indexOf(data[i]) == -1 &&
          typeof req.params[data[i]] == "string"
        ) {
          const sanitized = req.sanitize ? req.sanitize(req.params[data[i]]) : req.params[data[i]];
          req.params[data[i]] = (sanitized != null && typeof sanitized === 'string') ? sanitized.trim() : req.params[data[i]];
        }
      }
    }
    if (req.query) {
      data = Object.keys(req.query);
      for (var i = 0; i < data.length; i++) {
        if (
          ignore.indexOf(data[i]) == -1 &&
          typeof req.query[data[i]] == "string"
        ) {
          const sanitized = req.sanitize ? req.sanitize(req.query[data[i]]) : req.query[data[i]];
          req.query[data[i]] = (sanitized != null && typeof sanitized === 'string') ? sanitized.trim() : req.query[data[i]];
        }
      }
    }
    next();
  };
};
