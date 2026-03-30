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

-- initialize if not present
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
  if refillRate <= 0 then
    return {0, tokens, 1}
  end

  local missing = 1 - tokens
  local retryAfter = math.ceil(missing / refillRate)

  return {0, tokens, retryAfter} -- blocked
end

-- consume token
tokens = tokens - 1

-- save updated values
redis.call("HMSET", key,
  "tokens", tokens,
  "last_refill", now
)

-- dynamic TTL (cleanup idle keys)
local ttl = math.ceil(limit / refillRate)
if ttl < 1 then
  ttl = 1
end

redis.call("EXPIRE", key, ttl)

return {1, tokens, 0} -- allowed