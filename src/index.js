const rateLimiterPlugin = require("./plugin");
const fastify = require("fastify");
const { createRedisClient } = require("./config/redisClient");

const buildServer = (fastifyOptions = {}, pluginOptions = {}) => {
  const app = fastify(fastifyOptions);
  app.register(rateLimiterPlugin, pluginOptions);
  return app;
};

// ✅ Default export MUST be plugin
module.exports = rateLimiterPlugin;

// ✅ Optional named exports (advanced users)
module.exports.rateLimiterPlugin = rateLimiterPlugin;
module.exports.buildServer = buildServer;
module.exports.createRedisClient = createRedisClient;
module.exports.connectRedis = createRedisClient;
