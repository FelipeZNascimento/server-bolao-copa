const dotenv = require('dotenv');
dotenv.config();

export type hostConfig = {
  host: string;
  user: string;
  password: string;
  database: string;
};

const devServerConfig: hostConfig = {
  host: process.env.SQL_HOST_DEV as string,
  user: process.env.SQL_USER as string,
  password: process.env.SQL_PASS as string,
  database: process.env.SQL_DB as string
};

const serverConfig: hostConfig = {
  host: process.env.SQL_HOST as string,
  user: process.env.SQL_USER as string,
  password: process.env.SQL_PASS as string,
  database: process.env.SQL_DB as string
};

export const returnConfig = (env: string) => {
  if (env === 'production') {
    return serverConfig;
  } else {
    return devServerConfig;
  }
};
