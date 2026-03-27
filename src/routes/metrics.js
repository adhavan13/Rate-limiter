const { getMetrics } = require("../utils/metrics");

async function metricsRoute(fastify) {
  fastify.get("/metrics", async () => {
    return getMetrics();
  });
}

module.exports = { metricsRoute };
