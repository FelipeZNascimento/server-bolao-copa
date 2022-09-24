import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';

export interface IUserRaw {
  email?: string;
  id_user: number | null;
  is_active: boolean;
  name?: string;
  nickname: string;
  password?: string | null;
}

export interface IUser {
  email?: string;
  id: number | null;
  isActive: boolean;
  name?: string;
  newPassword?: string | null;
  nickname: string;
  password?: string | null;
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
  }

  replaceProperties(user: Partial<IUser>) {
    this.email = user.email || this.email;
    this.id = user.id || this.id;
    this.isActive = user.isActive || this.isActive;
    this.name = user.name || this.name;
    this.nickname = user.nickname || this.nickname;
    this.password = user.password || this.password;
  }

  formatRawUser(users: IUserRaw) {
    return {
      email: users.email,
      id: users.id_user,
      isActive: users.is_active,
      name: users.name,
      nickname: users.nickname,
      password: users.password
    };
  }

  async checkEmail(email: IUser['email'], id: IUser['id'] | string) {
    return super.runQuery(
      `SELECT email FROM users WHERE email = ? AND id != ?`,
      [email, id]
    );
  }

  async checkNickname(nickname: IUser['nickname'], id: IUser['id'] | string) {
    return super.runQuery(
      `SELECT nickname FROM users_info WHERE nickname = ? AND id_user != ?`,
      [nickname, id]
    );
  }

  async getAll() {
    return super.runQuery(
      `SELECT SQL_NO_CACHE id_user, name, nickname, is_active
              FROM users_info`
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
        VALUES(?, ?);`,
      [email, password]
    );
  }

  async registerInfo(id: IUser['id'], nickname: IUser['nickname']) {
    return super.runQuery(
      `INSERT INTO users_info (id_user, nickname, is_active) 
          VALUES(?, ?, ?);`,
      [id, nickname, false]
    );
  }

  async login(email: IUser['email'], password: IUser['password']) {
    return super.runQuery(
      `SELECT users.id, users.email, users_info.name, users_info.nickname
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
}

export default UserClass;
