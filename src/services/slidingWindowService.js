const { redisClient } = require("../config/redisClient");
const { slidingWindow } = require("../redis/lua/scripts");

const checkSlidingWindow = async ({ key, limit, windowSize }) => {
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / windowSize) * windowSize;
  const previousWindow = currentWindow - windowSize;

  const currentKey = `${key}:${currentWindow}`;
  const previousKey = `${key}:${previousWindow}`;

  let result;
  try {
    result = await redisClient.eval(slidingWindow, {
      keys: [currentKey, previousKey],
      arguments: [String(windowSize), String(limit), String(now)],
    });
  } catch (err) {
    console.error("checkSlidingWindow eval failed", {
      key,
      currentKey,
      previousKey,
      message: err.message,
    });
    throw err;
  }

  return {
    allowed: result[0] === 1,
    effectiveCount: parseFloat(result[1]),
  };
};

module.exports = { checkSlidingWindow };
