const fastify = require("fastify")({ logger: true, trustProxy: true });
const Redis = require("ioredis");

// ✅ Correct cloud Redis config
const redis = new Redis({
  host: "redis-17977.c299.asia-northeast1-1.gce.cloud.redislabs.com",
  port: 17977,
  username: "default",
  password: "EILMVLHw74oJJNY0WhfPljZLdByvT9I9",
});

// ✅ Handle connection errors (important)
redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

// ✅ Optional: verify connection
(async () => {
  try {
    const res = await redis.ping();
    console.log("Redis connected:", res);
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();

fastify.register(require("ratelimiter"), {
  redisClient: redis,
  limit: 10,
  refillRate: 1,
  algorithm: "token_bucket",
});

fastify.get("/", async (req, res) => {
  return { message: "Hello, world!" };
});

fastify.listen({ port: 4000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
