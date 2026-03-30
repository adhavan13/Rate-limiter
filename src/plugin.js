const fp = require("fastify-plugin");
const { rateLimiter } = require("./middleware/rateLimiter");
const { createRedisClient } = require("./config/redisClient");

async function rateLimiterPlugin(fastify, options) {
  let redis;
  let ownsRedisClient = false;

  if (options.redisClient) {
    // ✅ Mode 1: user provided client
    redis = options.redisClient;
  } else if (options.redis) {
    // ✅ Mode 2: create internally
    redis = createRedisClient(options.redis);
    ownsRedisClient = true;
  } else {
    throw new Error(
      "Redis configuration missing: provide either redisClient or redis config",
    );
  }

  // decorate fastify instance (clean way)
  fastify.decorate("rateLimiterRedis", redis);

  if (ownsRedisClient) {
    fastify.addHook("onClose", async () => {
      await redis.quit();
    });
  }

  fastify.addHook("preHandler", rateLimiter({ ...options, redis }));
}

module.exports = fp(rateLimiterPlugin);
