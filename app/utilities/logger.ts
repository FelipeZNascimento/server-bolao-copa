import express from 'express';
import fs from 'fs';
import chalk from 'chalk';
import onFinished from 'on-finished';

const getActualRequestDurationInMilliseconds = (start: [number, number]) => {
  const NS_PER_SEC = 1e9; // convert to nanoseconds
  const NS_TO_MS = 1e6; // convert to milliseconds
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

const logger = (req: any, res: any, next: express.NextFunction) => {
  let userId = '';
  if (req.session?.user) {
    userId = req.session.user.id;
  }

  onFinished(res, function (error, res) {
    const currentDatetime = new Date();
    const formattedDate =
      currentDatetime.getFullYear() +
      '-' +
      (currentDatetime.getMonth() + 1) +
      '-' +
      currentDatetime.getDate();

    const formattedTime =
      formattedDate +
      ' ' +
      currentDatetime.getHours() +
      ':' +
      currentDatetime.getMinutes() +
      ':' +
      currentDatetime.getSeconds();

    let method = req.method;
    let body =
      req.body && Object.keys(req.body).length > 0
        ? JSON.stringify(req.body)
        : null;
    let url = req.url;
    let status = res.statusCode;
    const start = process.hrtime();
    const durationInMilliseconds =
      getActualRequestDurationInMilliseconds(start);

    let errorLog = error ? `\nError log: ${error}` : '';
    if (userId === '' && req.session?.user) {
      userId = req.session.user.id;
    }

    let logColor = `[${chalk.blue(
      formattedTime
    )}] ${method}:${url} ${status} ${chalk.red(
      durationInMilliseconds
    )} ms [userId: ${userId}] ${errorLog}`;
    let log = `[${formattedTime}] ${method}:${url} ${status} ${durationInMilliseconds} ms [userId: ${userId}] ${errorLog}`;
    log += body ? `\n${body}` : '';

    console.log(`${logColor}`);
    fs.appendFile(`logs/${formattedDate}.txt`, log + '\n', (err) => {
      if (err) {
        console.log(err);
      }
    });
  });

  next();
};

module.exports = logger;
