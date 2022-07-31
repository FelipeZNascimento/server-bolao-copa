import { IUser } from './types';
const { promisify } = require('util');
var sql = require('../../sql/sql');
const asyncQuery = promisify(sql.query).bind(sql);
// node native promisify

export const initialize = (user: Partial<IUser>) => {
  return {
    id: user.id,
    email: user.email || '',
    name: user.name || '',
    nickname: user.nickname || '',
    password: user.password || '',
    isActive: user.isActive || false
  } as IUser;
};

export const getAll = () => {
  return asyncQuery(
    `SELECT SQL_NO_CACHE id_user, name, nickname, is_active
            FROM users_info`
  );
};

export const getById = async function (id: IUser['id']) {
  const rows = asyncQuery(
    `SELECT SQL_NO_CACHE id_user, name, nickname, is_active
        FROM users_info
        WHERE id_user = ?`,
    [id]
  );

  return rows;
};

export const login = async function (
  email: IUser['email'],
  password: IUser['password']
) {
  const rows = asyncQuery(
    `SELECT users.id, users.email, users_info.name, users_info.nickname
    FROM users
    INNER JOIN users_info ON users.id = users_info.id_user
    WHERE email = ? AND password = ?`,
    [email, password]
  );

  return rows;
};

export const checkEmail = async function (
  email: IUser['email'],
  loggedUserId: IUser['id'] | string
) {
  const rows = asyncQuery(
    `SELECT email FROM users WHERE email = ? AND id != ?`,
    [email, loggedUserId]
  );

  return rows;
};

export const checkNickname = async function (
  nickname: IUser['nickname'],
  loggedUserId: IUser['id'] | string
) {
  const rows = asyncQuery(
    `SELECT nickname FROM users_info WHERE nickname = ? AND id != ?`,
    [nickname, loggedUserId]
  );

  return rows;
};

export const registerInfo = async function (user: IUser) {
  const { id, nickname } = user;

  const rows = asyncQuery(
    `INSERT INTO users_info (id_user, nickname, is_active) 
        VALUES(?, ?, ?);`,
    [id, nickname, true]
  );

  return rows;
};

export const register = async function (user: IUser) {
  const { email, password } = user;

  const rows = asyncQuery(
    `INSERT INTO users (email, password)
      VALUES(?, ?);`,
    [email, password]
  );

  return rows;
};
