const kue = require("kue");
const { db } = require("./models");
const config = require("./config");

const queue = kue.createQueue({
  prefix: "q",
  redis: {
    host: "127.0.0.1",
    port: "6379",
    auth: null,
    retry_strategy: function (options) {
      if (options.error && options.error.code === "ECONNREFUSED") {
        // Try reconnecting after 1 second
        console.error("Redis connection refused. Retrying in 1 second...");
        return 1000;
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after an hour
        console.error("Retry time exhausted. Giving up.");
        return new Error("Retry time exhausted");
      }
      if (options.attempt > 10) {
        // End reconnecting after 10 attempts
        console.error("Max attempts exhausted. Giving up.");
        return new Error("Max attempts exhausted");
      }
      // Reconnect after
      return Math.min(options.attempt * 100, 3000);
    },
  },
});

module.exports = {
  init: () => {
    queue.process("img-upload", function (job, done) {
      Promise.all([
        db.productphoto.bulkCreate(job.data.attachmentEntries),
        db.productphoto.destroy({
          where: {
            id: job.data.productId,
          },
        }),
      ])
        .then((r) => {
          done(true);
        })
        .catch((err) => {
          console.log("error - " + err);
          done(false);
        });
    });
  },
};
