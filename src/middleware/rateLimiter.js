const { getKey } = require("../utils/keyGenerator.js");
const { getStrategy } = require("../strategies/index.js");
const { recordRequest } = require("../utils/metrics.js");

const rateLimiter = (options) => {
  const {
    limit = 10,
    refillRate = 1,
    windowSize = 60,
    algorithm = "token_bucket",
  } = options;
  console.log(
    `Rate limiter configured with limit: ${limit}, refillRate: ${refillRate}, windowSize: ${windowSize}, algorithm: ${algorithm}`,
  );
  return async (req, reply) => {
    const key = getKey(req, algorithm);
    const route = req.url;

    const strategy = getStrategy(algorithm);
    if (!strategy) {
      return reply
        .code(500)
        .send({ message: `Invalid rate limit algorithm: ${algorithm}` });
    }

    const payload =
      algorithm === "sliding_window"
        ? { key, limit, windowSize }
        : { key, limit, refillRate };

    let result;
    try {
      result = await strategy(payload);
    } catch (err) {
      console.error("rate limiter strategy execution failed", {
        algorithm,
        key,
        message: err.message,
      });
      return reply.code(500).send({ message: "Rate limiter internal error" });
    }

    if (!result.allowed) {
      recordRequest(route, false);
      return reply
        .code(429)
        .header("Retry-After", 10)
        .send({ message: "Too Many Requests" });
    }
    recordRequest(route, true);
    return;
  };
};

module.exports = { rateLimiter };
