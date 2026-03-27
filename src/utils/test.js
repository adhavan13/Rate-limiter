const axios = require("axios");

const URL = "http://localhost:3000/";
const TOTAL_REQUESTS = 50;

(async () => {
  try {
    const requests = [];

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      requests.push(
        axios
          .get(URL)
          .then((res) => {
            console.log(`Request ${i + 1}: ${res.status}`);
          })
          .catch((err) => {
            if (err.response) {
              console.log(
                `Request ${i + 1}: ${err.response.status} - ${err.response.data.message}`,
              );
            } else {
              console.error(`Request ${i + 1}: Error`, err.message);
            }
          }),
      );
    }

    await Promise.all(requests);
  } catch (err) {
    console.error("Load test execution failed:", err);
  }
})();
