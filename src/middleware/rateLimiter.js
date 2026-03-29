const { getKey } = require("../utils/keyGenerator.js");
const { getStrategy } = require("../strategies/strategy.js");
const { recordRequest } = require("../utils/metrics.js");

const rateLimiter = (options) => {
  const {
    redis,
    limit = 10,
    refillRate = 1,
    windowSize = 60,
    algorithm = "token_bucket",
  } = options;

  const strategy = getStrategy(algorithm);

  if (!strategy) {
    throw new Error(`Invalid rate limit algorithm: ${algorithm}`);
  }

  return async (req, reply) => {
    const key = getKey(req, algorithm);
    const route = req.url;

    let result;

    try {
      result = await strategy({
        redis,
        key,
        limit,
        refillRate,
        windowSize,
      });
    } catch (err) {
      console.error("rate limiter strategy execution failed", {
        algorithm,
        key,
        message: err.message,
      });

      return reply.code(500).send({
        message: "Rate limiter internal error",
      });
    }

    if (!result.allowed) {
      recordRequest(route, false);

      return reply
        .code(429)
        .header("Retry-After", result.retryAfter || 1)
        .send({ message: "Too Many Requests" });
    }

    recordRequest(route, true);

    reply.header("X-RateLimit-Limit", limit);
    reply.header("X-RateLimit-Remaining", result.remaining ?? 0);
  };
};

module.exports = { rateLimiter };
