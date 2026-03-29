const Redis = require("ioredis");

const createRedisClient = (config = {}) => {
  return new Redis(config);
};

module.exports = { createRedisClient };
