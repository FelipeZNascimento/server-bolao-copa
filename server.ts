import { CorsOptions } from 'cors';
import { Server } from 'http';

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');
const fs = require('fs');
const SQLConfig = require('./app/const/sqlConfig');
const logger = require('./app/utilities/logger');

// How to create localhost https node server
// https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/

dotenv.config();

const app = express();
const allowedOrigins = [
  'https://localhost',
  'http://localhost',
  'https://localhost:3000',
  'http://localhost:3000',
  /\.omegafox\.me$/
];

const options: CorsOptions = {
  origin: allowedOrigins
};

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins
  })
);

app.use(cors(options));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;

const sevenDays = 7 * 24 * 60 * 60 * 1000;

const sessionSettings = {
  cookie: {
    maxAge: sevenDays,
    sameSite: false,
    secure: true
  },
  resave: true,
  rolling: true,
  saveUninitialized: false,
  secret: sessionSecret as string,
  store: undefined,
  user: null
};

let server: Server;
let serverPort: number;
const environment = app.get('env');

app.set('trust proxy', 1); // trust first proxy

if (environment === 'production') {
  serverPort = 40000;
  server = http.createServer(app);
} else {
  serverPort = 63768;
  server = https.createServer(
    {
      key: fs.readFileSync('certs/key.pem'),
      cert: fs.readFileSync('certs/cert.pem')
    },
    app
  );
}

sessionSettings.store = new MySQLStore(SQLConfig.returnConfig(environment));

app.use(session(sessionSettings));
app.use(logger);

server
  .listen(serverPort, () => {
    console.log(
      `Web server listening on port ${serverPort} at ${environment} environment`
    );
  })
  .on('error', (error: any) => {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }

    console.log(result);
  });

const routes = require('./app/routes/appRoutes');
routes(app); // register the routes

module.exports = app;
