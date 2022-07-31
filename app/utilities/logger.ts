import express from "express";
import fs from "fs";
import chalk from "chalk";
import onFinished from "on-finished";

const getActualRequestDurationInMilliseconds = (start: [number, number]) => {
  const NS_PER_SEC = 1e9; // convert to nanoseconds
  const NS_TO_MS = 1e6; // convert to milliseconds
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

const logger = (req: any, res: any, next: express.NextFunction) => {
  let userId = "";
  if (req.session?.user) {
    userId = req.session.user.id;
  }

  onFinished(res, function (error, res) {
    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      " " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();

    let method = req.method;
    let url = req.url;
    let status = res.statusCode;
    const start = process.hrtime();
    const durationInMilliseconds =
      getActualRequestDurationInMilliseconds(start);

    let errorLog = error ? `\nError log: ${error}` : "";
    if (userId === "" && req.session?.user) {
      userId = req.session.user.id;
    }

    let logColor = `[${chalk.blue(
      formatted_date
    )}] ${method}:${url} ${status} ${chalk.red(
      durationInMilliseconds.toLocaleString()
    )} ms [userId: ${userId}] ${errorLog}`;

    let log = `[${formatted_date}] ${method}:${url} ${status} ${durationInMilliseconds.toLocaleString()} ms [userId: ${userId}] ${errorLog}`;

    console.log(`${logColor}`);
    fs.appendFile("request_logs.txt", log + "\n", (err) => {
      if (err) {
        console.log(err);
      }
    });
  });

  next();
};

module.exports = logger;