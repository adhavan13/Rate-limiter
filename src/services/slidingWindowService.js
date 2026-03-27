const { redisClient } = require("../redis/client.js");

const checkSlidingWindow = async (key, limit, windowSize) => {
  if (!Number.isFinite(windowSize) || windowSize <= 0) {
    windowSize = 60;
  }

  const now = Math.floor(Date.now() / 1000);

  const currentWindow = Math.floor(now / windowSize) * windowSize;
  const previousWindow = currentWindow - windowSize;

  const currentKey = `${key}:${currentWindow}`;
  const previousKey = `${key}:${previousWindow}`;

  // Increment first so concurrent requests each get a unique count.
  const currentCount = await redisClient.incr(currentKey);
  await redisClient.expire(currentKey, windowSize * 2);

  const previousCount = await redisClient.get(previousKey);

  console.log(
    `Sliding Window Data for key ${key}: currentCount=${currentCount}, previousCount=${previousCount}, currentWindow=${currentWindow}, previousWindow=${previousWindow}`,
  );

  const curr = parseInt(currentCount || "0");
  const prev = parseInt(previousCount || "0");

  const timeIntoWindow = now - currentWindow;
  const remainingTime = windowSize - timeIntoWindow;

  const effectiveCount = curr + (prev * remainingTime) / windowSize;

  if (effectiveCount >= limit) {
    return { allowed: false, effectiveCount };
  }

  return { allowed: true, effectiveCount };
};

module.exports = { checkSlidingWindow };
