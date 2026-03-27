const getKey = (req, algorithm) => {
  return `rate_limit:${algorithm}:${req.ip}`;
};

module.exports = { getKey };
