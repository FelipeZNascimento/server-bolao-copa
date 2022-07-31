import { returnConfig } from '../app/const/sqlConfig';
const mysql = require('@vlasky/mysql');
const express = require('express');

const app = express();
const environment = app.get('env');
const connection = mysql.createConnection(returnConfig(environment));

connection.connect(function (error: unknown) {
  if (error) {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }
    console.log(result);
    throw result;
  }
});

module.exports = connection;
