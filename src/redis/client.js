require("dotenv").config();
const { createClient } = require("redis");

console.log(process.env.REDIS_CONNECTION_STRING);
const client = createClient({
  url: process.env.REDIS_CONNECTION_STRING,
  socket: {
    tls: true, // 👈 THIS is missing
    rejectUnauthorized: false, // 👈 important for Redis Cloud
    connectTimeout: 10000,
  },
});

client.on("error", (err) => console.error("Redis Error:", err));
client.on("connect", () => console.log("🔄 Connecting to Redis..."));
client.on("ready", () => console.log("✅ Redis ready"));

const connectRedis = async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
};

module.exports = { connectRedis, client };
