const fs = require("fs");
const path = require("path");

const loadScript = (fileName) => {
  return fs.readFileSync(path.join(__dirname, fileName), "utf8");
};

const scripts = {
  tokenBucket: loadScript("tokenBucket.lua"),
  slidingWindow: loadScript("fixedWindow.lua"),
};

module.exports = scripts;
