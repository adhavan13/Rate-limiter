const { tokenBucket } = require("../redis/lua/scripts");

const checkTokenBucket = async ({ redis, key, limit, refillRate }) => {
  const now = Date.now(); // ✅ millisecond precision

  let result;

  try {
    result = await redis.eval(tokenBucket, {
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

  const allowed = result[0] === 1;
  const tokens = parseFloat(result[1]);
  const parsedRetryAfter = parseFloat(result[2]);
  const retryAfter = Number.isFinite(parsedRetryAfter)
    ? Math.max(0, parsedRetryAfter)
    : 1;

  return {
    allowed,
    remaining: Math.max(0, Math.floor(tokens)), // ✅ normalize
    retryAfter, // ✅ real value
  };
};

module.exports = { checkTokenBucket };
