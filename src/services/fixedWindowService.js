const { slidingWindow } = require("../redis/lua/scripts");

const checkFixedWindow = async ({ redis, key, limit, windowSize }) => {
  const now = Math.floor(Date.now() / 1000);

  let result;

  try {
    result = await redis.eval(
      slidingWindow,
      1,
      key,
      String(windowSize),
      String(limit),
      String(now),
    );
  } catch (err) {
    console.error("checkFixedWindow eval failed", {
      key,
      message: err.message,
    });
    throw err;
  }

  return {
    allowed: result[0] === 1,
    remaining: Math.max(0, limit - parseFloat(result[1])),
    retryAfter: result[2],
  };
};

module.exports = { checkFixedWindow };
