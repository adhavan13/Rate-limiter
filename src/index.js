const fastify = require("fastify");
const rateLimiterPlugin = require("./plugin");
const { createRedisClient } = require("./config/redisClient");

const buildServer = (fastifyOptions = {}, pluginOptions = {}) => {
  const app = fastify(fastifyOptions);
  app.register(rateLimiterPlugin, pluginOptions);
  return app;
};

module.exports = {
  rateLimiterPlugin,
  buildServer,
  createRedisClient,
  connectRedis: createRedisClient,
};
