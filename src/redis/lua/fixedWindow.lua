-- KEYS[1] = key

-- ARGV[1] = windowSize
-- ARGV[2] = limit
-- ARGV[3] = currentTime

local key = KEYS[1]

local windowSize = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- get stored values
local data = redis.call("HMGET", key, "count", "timestamp")

local count = tonumber(data[1]) or 0
local timestamp = tonumber(data[2]) or 0

-- check if window expired
if (now - timestamp) > windowSize then
  count = 0
  timestamp = now
end

-- check limit
if count >= limit then
  local retryAfter = windowSize - (now - timestamp)
  if retryAfter < 0 then retryAfter = 0 end
  return {0, count, retryAfter}
end

-- increment
count = count + 1

-- save back
redis.call("HMSET", key, "count", count, "timestamp", timestamp)

-- expiry (cleanup)
redis.call("EXPIRE", key, windowSize)

return {1, count, 0}