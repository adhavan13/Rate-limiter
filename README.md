# fastify-distributed-rate-limiter

> A production-grade, distributed rate limiting plugin for Fastify — powered by Redis and atomic Lua scripts.

[![npm version](https://img.shields.io/npm/v/fastify-distributed-rate-limiter.svg)](https://www.npmjs.com/package/fastify-distributed-rate-limiter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![Redis](https://img.shields.io/badge/redis-%3E%3D6.0-red)](https://redis.io)

---

## Overview

`fastify-distributed-rate-limiter` enforces request rate limits **across multiple server instances** using Redis as a centralized state store. It eliminates race conditions through atomic Lua scripts and supports multiple algorithms that can be selected dynamically per request.

Built as a Fastify plugin — drop it in, configure it, and it works.

---

## Architecture

![Architecture Diagram](./architecture.svg)

The request flow:

```
Client → Load Balancer → Fastify Instance (preHandler Hook)
                              ↓
                       Strategy Layer
                              ↓
                    Redis + Lua Script (Atomic)
                              ↓
                     Allow / 429 Response
```

All Fastify instances share a single Redis state store. Every rate-limiting decision is made atomically inside Redis via a Lua script — no locks, no race conditions.

---

## Features

- **Multiple algorithms** — Token Bucket and Sliding Window Counter, selectable at runtime
- **Atomic execution** — Lua scripts guarantee correctness under concurrency
- **Distributed by design** — shared Redis state works across any number of instances
- **Dynamic strategy selection** — choose algorithm per-route, per-user, or by any custom logic
- **Flexible key design** — limit by IP, user ID, endpoint, or a combination
- **Dynamic `Retry-After`** — computed inside Lua and returned via HTTP headers
- **Observability** — built-in metrics endpoint tracking total, allowed, and blocked requests
- **Config-driven** — no hardcoded limits; behavior defined via config function
- **Redis flexibility** — supports local, cloud (TLS/password), or injected Redis clients

---

## Installation

```bash
npm install fastify-distributed-rate-limiter
```

**Peer dependencies:**

```bash
npm install fastify ioredis
```

---

## Quick Start

```javascript
const fastify = require("fastify")({ logger: true, trustProxy: true });
const Redis = require("ioredis");

// ✅ Correct cloud Redis config
const redis = new Redis({
  host: "*******************************",
  port: ********,
  username: "*******",
  password: "****************************",
});

// ✅ Handle connection errors (important)
redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

fastify.register(require("ratelimiter"), {
  redisClient: redis,
  limit: 10,
  refillRate: 1,
  algorithm: "token_bucket",
});

fastify.listen({ port: 4000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
```

---

## Configuration

### Plugin Options

| Option | Type | Required | Description |
|---|---|---|---|
| `redis` | `object \| RedisClient` | Yes | Redis connection config or existing ioredis client |
| `getConfig` | `function(req)` | Yes | Returns rate limit config for each request |
| `keyGenerator` | `function(req)` | No | Custom Redis key generator |
| `errorHandler` | `function(err, req, reply)` | No | Custom error handler |

### `getConfig(req)` Return Object

| Field | Type | Description |
|---|---|---|
| `algorithm` | `'token-bucket' \| 'sliding-window'` | Rate limiting algorithm to use |
| `limit` | `number` | Maximum requests allowed |
| `windowMs` | `number` | Time window in milliseconds (sliding window) |
| `capacity` | `number` | Max token capacity (token bucket) |
| `refillRate` | `number` | Tokens per second refill rate (token bucket) |

## Algorithms

### Token Bucket

Best for APIs that allow **burst traffic** — users can accumulate tokens and spend them in bursts, up to the bucket capacity.

```javascript
getConfig: (req) => ({
  algorithm: 'token_bucket',
  capacity: 20,      // max burst size
  refillRate: 5,     // tokens per second
})
```

**How it works:**
- Stores `tokens` and `last_refill` timestamp in Redis
- On each request, refills tokens based on elapsed time, then attempts to consume one
- If tokens are available: allow. If not: 429 with `Retry-After` header
- All logic runs atomically inside a Lua script

### Fixed Window Counter

Best for **smooth, consistent rate limiting** — no burst allowance, requests are spread evenly.

```javascript
getConfig: (req) => ({
  algorithm: 'fixed_window',
  limit: 100,
  windowSize: 60,  // 60 seconds
})
```

**How it works:**
- Tracks counters for the current and previous time windows
- Applies a weighted interpolation to estimate the request rate across the sliding boundary
- More accurate and memory-efficient than storing individual request timestamps

---

## Redis Key Format

```
rate_limit:{algorithm}:{user_or_ip}:{route}
```

**Examples:**
```
rate_limit:sliding-window:192.168.1.1:/api/data
rate_limit:token-bucket:user_abc123:/payment
```

Custom key generator:

```javascript
keyGenerator: (req) => `rl:${req.user?.id ?? req.ip}:${req.routerPath}`
```

---

## HTTP Headers

On every response, the plugin sets the following headers:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait before retrying (only on 429) |

---

## Metrics

A built-in metrics endpoint is registered automatically:

```
GET /rate-limit/metrics
```

**Response:**
```json
{
  "total": 10523,
  "allowed": 10201,
  "blocked": 322,
  "routes": {
    "/api/data": { "total": 8000, "allowed": 7900, "blocked": 100 },
    "/login":    { "total": 2523, "allowed": 2301, "blocked": 222 }
  }
}
```

---

## IP Handling

The plugin resolves the client IP in this order:

1. `req.ip` (Fastify native, respects `trustProxy`)
2. `x-forwarded-for` header (proxy environments)
3. Falls back to direct remote address

> **Important:** Enable `trustProxy: true` in your Fastify instance if your server sits behind a reverse proxy or load balancer.

```javascript
const fastify = require('fastify')({ trustProxy: true });
```

---

## Why Lua Scripts?

Early versions used multiple sequential Redis calls (`GET` → compute → `SET`), which caused **race conditions** under concurrent load: two requests could read the same counter, both pass, and both write back — effectively bypassing the limit.

The solution: move all logic into Redis using a **Lua script**. Redis executes Lua scripts atomically (single-threaded), so the read-compute-write cycle is always an uninterruptible unit. No locks needed.

```lua
-- Simplified token bucket Lua script
local tokens = tonumber(redis.call('HGET', key, 'tokens'))
local last   = tonumber(redis.call('HGET', key, 'last_refill'))
local now    = tonumber(ARGV[1])

-- Refill based on elapsed time
local elapsed = (now - last) / 1000
tokens = math.min(capacity, tokens + elapsed * refillRate)

if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HSET', key, 'tokens', tokens, 'last_refill', now)
  return {1, tokens, 0}  -- allowed
else
  local retry_after = math.ceil((1 - tokens) / refillRate)
  return {0, 0, retry_after}  -- blocked
end
```

---

## Design Patterns

| Pattern | Usage |
|---|---|
| **Strategy Pattern** | Pluggable algorithm selection at runtime |
| **Middleware Pattern** | Fastify `preHandler` hook intercepts all requests |
| **Plugin Pattern** | Encapsulated as a reusable Fastify plugin |
| **Config-driven Design** | No hardcoded limits; behavior defined by caller |

---

## Use Cases

- **API Gateways** — global request throttling across all services
- **Authentication endpoints** — protect `/login` and `/register` from brute force
- **Payment APIs** — controlled burst handling for sensitive transactions
- **Public APIs** — enforce fair usage across anonymous and authenticated users

---

## Requirements

- Node.js >= 16
- Fastify >= 4
- Redis >= 6
- ioredis >= 5

---
