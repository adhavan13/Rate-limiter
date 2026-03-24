// redis.js
require("dotenv").config();
const { createClient } = require("redis");

const client = process.env.REDIS_CONNECTION_STRING
  ? createClient({
      url: process.env.REDIS_CONNECTION_STRING,
    })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
      },
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    });

client.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log("✅ Redis connected");
  }
};

module.exports = { connectRedis, client };
