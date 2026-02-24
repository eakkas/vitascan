const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 10 report analyses per user per hour
const analyzeLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:analyze",
});

// 100 marker info lookups per user per hour
// (most are served from localStorage/Supabase cache so this is rarely hit)
const markerInfoLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  prefix: "rl:marker-info",
});

module.exports = { analyzeLimit, markerInfoLimit };
