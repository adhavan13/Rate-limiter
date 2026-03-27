-- KEYS[1] = currentKey
-- KEYS[2] = previousKey

-- ARGV[1] = windowSize
-- ARGV[2] = limit
-- ARGV[3] = currentTime

local currentKey = KEYS[1]
local previousKey = KEYS[2]

local windowSize = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- increment current window
local currentCount = redis.call("INCR", currentKey)

-- set expiry
local ttl = math.floor(windowSize * 2)
if ttl < 1 then
  ttl = 1
end
redis.call("EXPIRE", currentKey, ttl)

-- get previous window count
local previousCount = redis.call("GET", previousKey)
if not previousCount then
  previousCount = 0
else
  previousCount = tonumber(previousCount)
end

-- calculate time logic
local currentWindow = math.floor(now / windowSize) * windowSize
local timeIntoWindow = now - currentWindow
local remainingTime = windowSize - timeIntoWindow

-- effective count
local effectiveCount = currentCount + (previousCount * remainingTime) / windowSize

-- decision
if effectiveCount >= limit then
  return {0, tostring(effectiveCount)} -- blocked
else
  return {1, tostring(effectiveCount)} -- allowed
end