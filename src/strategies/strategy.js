const { checkTokenBucket } = require("../services/tokenBucketService");
const { checkFixedWindow } = require("../services/fixedWindowService");

const strategies = {
  token_bucket: checkTokenBucket,
  fixed_window: checkFixedWindow,
};

const getStrategy = (name) => {
  return strategies[name];
};

module.exports = { getStrategy };
