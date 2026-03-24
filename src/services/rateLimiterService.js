const { client } = require("../redis/client.js");

const checkRateLimit = async (key, limit, refillRate) => {
  const now = Math.floor(Date.now() / 1000);

  const data = await client.hGetAll(key);

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

  await client.hSet(key, {
    tokens,
    last_refill: now,
  });

  await client.expire(key, 60); // TTL

  return { allowed: true, tokens };
};

module.exports = { checkRateLimit };
