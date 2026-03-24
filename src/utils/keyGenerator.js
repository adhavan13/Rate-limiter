const getKey = (req) => {
  return `rate_limit:user:${req.ip}`;
};

module.exports = { getKey };
