const { redisClient } = require("../config/redisClient");
const { tokenBucket } = require("../redis/lua/scripts");

const checkTokenBucket = async ({ key, limit, refillRate }) => {
  const now = Math.floor(Date.now() / 1000);

  let result;
  try {
    result = await redisClient.eval(tokenBucket, {
      keys: [key],
      arguments: [String(limit), String(refillRate), String(now)],
    });
  } catch (err) {
    console.error("checkTokenBucket eval failed", {
      key,
      message: err.message,
    });
    throw err;
  }

  return {
    allowed: result[0] === 1,
    tokens: parseFloat(result[1]),
  };
};

module.exports = { checkTokenBucket };
