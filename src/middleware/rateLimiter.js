const { getKey } = require("../utils/keyGenerator.js");

const { checkRateLimit } = require("../services/rateLimiterService.js");

const rateLimiter = (options) => {
  const { limit = 10, refillRate = 1 } = options;

  return async (req, reply) => {
    const key = getKey(req);

    const result = await checkRateLimit(key, limit, refillRate);

    if (!result.allowed) {
      reply
        .code(429)
        .header("Retry-After", 10)
        .send({ message: "Too Many Requests" });
      return;
    }
  };
};

module.exports = { rateLimiter };
