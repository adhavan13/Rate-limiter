const { getKey } = require("../utils/keyGenerator.js");
const { getStrategy } = require("../strategies/index.js");

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

    const strategy = getStrategy(algorithm);
    if (!strategy) {
      return reply
        .code(500)
        .send({ message: `Invalid rate limit algorithm: ${algorithm}` });
    }

    const thirdArg = algorithm === "sliding_window" ? windowSize : refillRate;
    const result = await strategy(key, limit, thirdArg);

    if (!result.allowed) {
      return reply
        .code(429)
        .header("Retry-After", 10)
        .send({ message: "Too Many Requests" });
    }
    return;
  };
};

module.exports = { rateLimiter };
