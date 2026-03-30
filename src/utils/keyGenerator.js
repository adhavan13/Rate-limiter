const normalizeClientId = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "anonymous";
  }

  const withoutIpv4MappedPrefix = raw.startsWith("::ffff:")
    ? raw.slice(7)
    : raw;

  if (withoutIpv4MappedPrefix === "::1") {
    return "127.0.0.1";
  }

  // Avoid delimiter collisions in Redis keys for IPv6 addresses.
  return withoutIpv4MappedPrefix.replace(/:/g, "_");
};

const getClientId = (req = {}) => {
  const userId = req.user?.id;
  if (userId) {
    return normalizeClientId(userId);
  }

  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return normalizeClientId(forwardedFor.split(",")[0].trim());
  }

  return normalizeClientId(
    req.ip ||
      req.raw?.socket?.remoteAddress ||
      req.socket?.remoteAddress ||
      "anonymous",
  );
};

const getKey = (req, algorithm) => {
  const id = getClientId(req);
  return `rate_limit:${algorithm}:${id}`;
};
module.exports = { getKey };
