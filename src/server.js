// server.js

const fastify = require("fastify")({
  // logger: true,
});
const { connectRedis, redisClient } = require("./redis/client");
const { rateLimiter } = require("./middleware/rateLimiter");

fastify.addHook(
  "preHandler",
  rateLimiter({
    limit: 1,
    refillRate: 1,
  }),
);

fastify.get("/", async (request, reply) => {
  return { message: "Hello World" };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;

    await connectRedis();

    await fastify.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
