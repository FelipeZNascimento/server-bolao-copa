const asyncHttps = function (url: string) {
  return new Promise((resolve, reject) => {
    const https = require("https");
    const request = https.get(url, (response: any) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error("Failed to load page, status code: " + response.statusCode)
        );
      }
      // temporary data holder
      const body: any = [];
      // on every content chunk, push it to the data array
      response.on("data", (chunk: any) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on("end", () => resolve(body.join("")));
    });
    // handle connection errors of the request
    request.on("error", (error: any) => reject(error));
  });
};

module.exports = asyncHttps;
