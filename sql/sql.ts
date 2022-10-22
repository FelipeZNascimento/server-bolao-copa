import { returnConfig } from '../app/const/sqlConfig';
const mysql = require('@vlasky/mysql');
const express = require('express');

const app = express();
const environment = app.get('env');
const pool = mysql.createPool(returnConfig(environment));


module.exports = pool;
