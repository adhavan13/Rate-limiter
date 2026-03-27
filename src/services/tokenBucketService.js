const { redisClient } = require("../redis/client.js");

const checkTokenBucket = async (key, limit, refillRate) => {
  const now = Math.floor(Date.now() / 1000);

  const data = await redisClient.hGetAll(key);

  console.log(`Data for key ${key}:`, data);

  let tokens = data.tokens ? parseFloat(data.tokens) : limit;
  let lastRefill = data.last_refill ? parseInt(data.last_refill) : now;

  // refill logic
  const elapsed = now - lastRefill;
  const refill = elapsed * refillRate;
  tokens = Math.min(limit, tokens + refill);

  if (tokens < 1) {
    return { allowed: false, tokens };
  }

  tokens -= 1;

  await redisClient.hSet(key, {
    tokens,
    last_refill: now,
  });

  await redisClient.expire(key, 60); // TTL

  return { allowed: true, tokens };
};

module.exports = { checkTokenBucket };
