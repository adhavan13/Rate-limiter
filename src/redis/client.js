require("dotenv").config();
// const redis = require("redis");

// const redisClient = redis.createClient({
//   password: process.env.REDIS_PASSWORD,
//   socket: {
//     host: process.env.REDIS_CONNECTION_STRING,
//     port: process.env.REDIS_PORT,
//   },
// });

// redisClient.on("error", (err) => {
//   console.error("Redis Client Error", err);
// });

// const connectRedis = async () => {
//   try {
//     await redisClient.connect();
//     console.log("✅ Connected to Redis");
//   } catch (err) {
//     console.error("Failed to connect to Redis", err);
//     process.exit(1);
//   }
// };

// module.exports = { connectRedis, redisClient };
const { createClient } = require("redis");

const redisClient = createClient({
  username: "default",
  password: "EILMVLHw74oJJNY0WhfPljZLdByvT9I9",
  socket: {
    host: "redis-17977.c299.asia-northeast1-1.gce.cloud.redislabs.com",
    port: 17977,
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (err) {
    console.error("Failed to connect to Redis", err);
    process.exit(1);
  }
};
// await connectRedis();

module.exports = { connectRedis, redisClient };
