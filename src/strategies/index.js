const { checkTokenBucket } = require("../services/tokenBucketService");
const { checkSlidingWindow } = require("../services/slidingWindowService");

const strategies = {
  token_bucket: checkTokenBucket,
  sliding_window: checkSlidingWindow,
};

const getStrategy = (name) => {
  return strategies[name];
};

module.exports = { getStrategy };
