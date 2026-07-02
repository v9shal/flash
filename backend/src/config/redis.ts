import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
    retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
    maxRetriesPerRequest: 3,
     reconnectOnError(err) {
    return err.message.includes("READONLY");
  },


});