const { slidingWindow } = require("../redis/lua/scripts");

const checkSlidingWindow = async ({ redis, key, limit, windowSize }) => {
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / windowSize) * windowSize;
  const previousWindow = currentWindow - windowSize;

  const currentKey = `${key}:${currentWindow}`;
  const previousKey = `${key}:${previousWindow}`;

  let result;

  try {
    result = await redis.eval(slidingWindow, {
      keys: [currentKey, previousKey],
      arguments: [String(windowSize), String(limit), String(now)],
    });
  } catch (err) {
    console.error("checkSlidingWindow eval failed", {
      key,
      message: err.message,
    });
    throw err;
  }

  return {
    allowed: result[0] === 1,
    remaining: Math.max(0, limit - parseFloat(result[1])),
    retryAfter: 1,
  };
};

module.exports = { checkSlidingWindow };
