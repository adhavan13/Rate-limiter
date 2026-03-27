const metrics = {
  totalRequests: 0,
  allowedRequests: 0,
  blockedRequests: 0,
  perRoute: {},
};

const recordRequest = (route, allowed) => {
  metrics.totalRequests++;

  if (allowed) metrics.allowedRequests++;
  else metrics.blockedRequests++;

  if (!metrics.perRoute[route]) {
    metrics.perRoute[route] = {
      total: 0,
      allowed: 0,
      blocked: 0,
    };
  }

  metrics.perRoute[route].total++;
  if (allowed) metrics.perRoute[route].allowed++;
  else metrics.perRoute[route].blocked++;
};

const getMetrics = () => metrics;

module.exports = { recordRequest, getMetrics };
