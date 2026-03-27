-- KEYS[1] = key

-- ARGV[1] = limit
-- ARGV[2] = refillRate (tokens per second)
-- ARGV[3] = currentTime

local key = KEYS[1]

local limit = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- get existing data
local data = redis.call("HMGET", key, "tokens", "last_refill")

local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if tokens == nil then
  tokens = limit
end

if last_refill == nil then
  last_refill = now
end

-- calculate refill
local elapsed = now - last_refill
local refill = elapsed * refillRate

tokens = math.min(limit, tokens + refill)

-- decision
if tokens < 1 then
  return {0, tokens} -- blocked
end

-- consume token
tokens = tokens - 1

-- save updated values
redis.call("HMSET", key,
  "tokens", tokens,
  "last_refill", now
)

redis.call("EXPIRE", key, 60)

return {1, tokens} -- allowed