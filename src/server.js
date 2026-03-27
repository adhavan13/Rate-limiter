// server.js

const fastify = require("fastify")({
  // logger: true,
});
const { connectRedis } = require("./config/redisClient");
const { rateLimiter } = require("./middleware/rateLimiter");
const { metricsRoute } = require("./routes/metrics");

fastify.addHook(
  "preHandler",
  rateLimiter({
    limit: 10,
    refillRate: 1,
    windowSize: 60,
    // algorithm: "sliding_window",
    algorithm: "token_bucket",
  }),
);

fastify.get("/", async (request, reply) => {
  try {
    return { message: "Hello World" };
  } catch (err) {
    console.error("Route handler failed:", err);
    return reply.code(500).send({ message: "Internal server error" });
  }
});

fastify.register(metricsRoute);

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
    console.error("Server startup failed:", err);
    process.exit(1);
  }
};

start();
