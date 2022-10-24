import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';

export interface IUserOld {
  name: string;
  fullName: string;
  email: string;
}

export interface IUserRaw {
  email?: string;
  id_user: number | null;
  is_active: boolean;
  name?: string;
  nickname: string;
  password?: string | null;
  last_timestamp: string;
  token?: string | null;
}

export interface IUser {
  email?: string;
  id: number | null;
  isActive: boolean;
  name?: string;
  newPassword?: string | null;
  nickname: string;
  password?: string | null;
  lastTimestamp: string;
  token?: string | null;
}

class UserClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  email: string;
  id: number | null;
  isActive: boolean;
  name?: string;
  nickname: string;
  password?: string | null;
  newPassword?: string | null;
  lastTimestamp: string | null;
  token?: string | null;

  constructor(user: Partial<IUser>, req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.email = user.email || '';
    this.id = Number.isInteger(user.id) ? Number(user.id) : null;
    this.isActive = user.isActive || false;
    this.name = user.name || '';
    this.nickname = user.nickname || '';
    this.password = user.password || null;
    this.newPassword = user.newPassword || null;
    this.token = user.token || null;
    this.lastTimestamp = user.lastTimestamp || null;
  }

  set(users: IUser) {
    this.email = users.email || '';
    this.id = users.id;
    this.isActive = users.isActive;
    this.name = users.name;
    this.nickname = users.nickname;
    this.password = users.password;
    this.lastTimestamp = users.lastTimestamp;
    this.token = users.token || null;
  }

  formatRawUser(users: IUserRaw) {
    return {
      email: users.email || '',
      id: users.id_user,
      isActive: Boolean(users.is_active),
      name: users.name,
      nickname: users.nickname,
      password: users.password,
      lastTimestamp: users.last_timestamp,
      token: users.token || null
    };
  }

  async checkEmail(email: IUser['email'], id: IUser['id'] | string) {
    return super.runQuery(
      `SELECT users_info.id_user, users_info.name, users_info.nickname, users.email
        FROM users
        INNER JOIN users_info ON users.id = users_info.id_user
        WHERE users.email = ? AND users.id != ?`,
      [email, id]
    );
  }

  async checkToken(email: IUser['email'], token: IUser['token']) {
    return super.runQuery(
      `SELECT password_recovery.id_user, password_recovery.timestamp, NOW() as now
        FROM password_recovery
        INNER JOIN users ON password_recovery.id_user = users.id
        WHERE password_recovery.token = ? AND users.email = ?
        AND password_recovery.timestamp > (NOW() - INTERVAL 30 MINUTE)
        AND password_recovery.consumed = 0
        ORDER BY timestamp DESC
        LIMIT 1`,
      [token, email]
    );
  }

  async consumeToken(token: IUser['token']) {
    return super.runQuery(
      `UPDATE password_recovery
        SET consumed = 1
        WHERE token = ?`,
      [token]
    );
  }

  async checkNickname(nickname: IUser['nickname'], id: IUser['id'] | string) {
    return super.runQuery(
      `SELECT nickname FROM users_info WHERE nickname = ? AND id_user != ?`,
      [nickname, id]
    );
  }

  async getOld() {
    return super.runQuery(
      `SELECT name, full_name as fullName, email FROM users2018`
    );
  }

  async getAll() {
    return super.runQuery(
      `SELECT SQL_NO_CACHE users_info.id_user, users_info.name, users_info.nickname, users_info.is_active,
        UNIX_TIMESTAMP(users_info.last_timestamp) as last_timestamp, users.email
        FROM users_info
        INNER JOIN users ON users.id = users_info.id_user`
    );
  }

  async getAllActive() {
    return super.runQuery(
      `SELECT SQL_NO_CACHE id_user, name, nickname, is_active,
        UNIX_TIMESTAMP(last_timestamp) as last_timestamp
        FROM users_info
        WHERE is_active = 1`
    );
  }

  async getById(id: IUser['id']) {
    if (id === null) {
      return [];
    }

    return super.runQuery(
      `SELECT SQL_NO_CACHE id_user, name, nickname, is_active
        FROM users_info
        WHERE id_user = ?`,
      [id]
    );
  }

  async register(email: IUser['email'], password: IUser['password']) {
    return super.runQuery(
      `INSERT INTO users (email, password)
        VALUES(?, ?)`,
      [email, password]
    );
  }

  async registerInfo(id: IUser['id'], nickname: IUser['nickname']) {
    return super.runQuery(
      `INSERT INTO users_info (id_user, nickname, is_active) 
          VALUES(?, ?, 0)`,
      [id, nickname, false]
    );
  }

  async login(email: IUser['email'], password: IUser['password']) {
    return super.runQuery(
      `SELECT users_info.id_user, users.email, users_info.name, users_info.nickname,
      users_info.is_active, users_info.last_timestamp
      FROM users
      INNER JOIN users_info ON users.id = users_info.id_user
      WHERE email = ? AND password = ?`,
      [email, password]
    );
  }

  async updateInfo(
    id: IUser['id'],
    name: IUser['name'],
    nickname: IUser['nickname']
  ) {
    return super.runQuery(
      `UPDATE users_info
        SET name = ?,
        nickname = ?
        WHERE id_user = ?`,
      [name, nickname, id]
    );
  }

  async updateTimestamp(id: IUser['id']) {
    return super.runQuery(
      `UPDATE users_info
        SET last_timestamp = NOW()
        WHERE id_user = ?`,
      [id]
    );
  }

  async updatePassword(
    id: IUser['id'],
    password: IUser['password'],
    newPassword: IUser['newPassword']
  ) {
    return super.runQuery(
      `UPDATE users
        SET password = ?
        WHERE id = ? AND password = ?`,
      [newPassword, id, password]
    );
  }

  async updatePasswordViaToken(
    id: IUser['id'],
    newPassword: IUser['newPassword'],
    token: IUser['token']
  ) {
    console.log(id, newPassword, token);
    return super.runQuery(
      `UPDATE users
        JOIN password_recovery ON (password_recovery.token = ? AND password_recovery.consumed = 0)
        SET users.password = ?
        WHERE users.id = ?`,
      [token, newPassword, id]
    );
  }

  async setPasswordRecovery(id: IUser['id'], token: string) {
    return super.runQuery(
      `INSERT INTO password_recovery (id_user, token) 
        VALUES(?, ?);`,
      [id, token]
    );
  }

  async updateIsActive(id: IUser['id'], updateIsActive: IUser['isActive']) {
    return super.runQuery(
      `UPDATE users_info
      SET is_active = ?
      WHERE id_user = ?`,
      [updateIsActive, id]
    );
  }
}

export default UserClass;
