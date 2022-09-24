import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IUser } from './user';
import { ITeam } from './team';

export interface IExtraBetRaw {
  id: number;
  id_match: number;
  id_user: number;
  id_extra_type: number;
  id_team: number | null;
  id_player: number | null;
  timestamp: string;
  user_nickname: string;
  user_name: string;
  user_is_active: boolean;
}

export interface INewExtraBet {
  id: number | null;
  idExtraType: number;
  idPlayer: number | null;
  idTeam: number | null;
  idUser: number | null;
}

export interface IExtraBet {
  id: number | null;
  idExtraType: number;
  idPlayer: number | null;
  idTeam?: number | null;
  idUser: number | null;
  team: ITeam | null;
  timestamp: string;
  user: IUser;
}

class ExtraBetClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  newExtraBet: INewExtraBet | null;
  extraBets: IExtraBet[];
  loggedUserExtraBets: IExtraBet[];

  constructor(req?: any, res?: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.newExtraBet = null;
    this.extraBets = [];
    this.loggedUserExtraBets = [];
  }

  buildConfigObject() {
    return {
      extraBets: this.extraBets,
      loggedUserExtraBets: this.loggedUserExtraBets
    };
  }

  setExtraBets(extraBets: IExtraBet[]) {
    this.extraBets = extraBets;
  }

  setLoggedUserExtraBets(extraBets: IExtraBet[]) {
    this.loggedUserExtraBets = extraBets;
  }

  setNewExtraBet(extraBet: INewExtraBet) {
    this.newExtraBet = extraBet;
  }

  formatRawExtraBet(extraBetRaw: IExtraBetRaw, teams: ITeam[]) {
    const team = teams && teams.find((item) => item.id === extraBetRaw.id_team);
    return {
      id: extraBetRaw.id,
      timestamp: extraBetRaw.timestamp,
      idExtraType: extraBetRaw.id_extra_type,
      idPlayer: extraBetRaw.id_player,
      idUser: extraBetRaw.id_user,
      user: {
        id: extraBetRaw.id_user,
        name: extraBetRaw.user_name,
        nickname: extraBetRaw.user_nickname,
        isActive: extraBetRaw.user_is_active
      },
      team: team !== undefined ? team : null
    };
  }

  async getAll(seasonStart: number) {
    return super.runQuery(
      `SELECT extra_bets.id, extra_bets.id_user, extra_bets.id_extra_type, extra_bets.id_team,
        extra_bets.id_player, extra_bets.timestamp,
        users_info.nickname as user_nickname, users_info.name as user_name,
        users_info.is_active as user_is_active
        FROM extra_bets
        LEFT JOIN users_info ON extra_bets.id_user = users_info.id_user
        WHERE ? < UNIX_TIMESTAMP()`,
      [seasonStart]
    );
  }

  async getFromLoggedUser(id: IUser['id']) {
    if (!id) {
      return [];
    }

    return super.runQuery(
      `SELECT extra_bets.id, extra_bets.id_user, extra_bets.id_extra_type, extra_bets.id_team,
        extra_bets.id_player, extra_bets.timestamp,
        users_info.nickname as user_nickname, users_info.name as user_name,
        users_info.is_active as user_is_active
        FROM extra_bets
        LEFT JOIN users_info ON extra_bets.id_user = users_info.id_user
        WHERE extra_bets.id_user = ?`,
      [id]
    );
  }

  async update(
    idUser: IUser['id'],
    idExtraType: IExtraBet['idExtraType'],
    idTeam: IExtraBet['idTeam'],
    idPlayer: IExtraBet['idPlayer'],
    seasonStart: number
  ) {
    return super.runQuery(
      `INSERT INTO extra_bets (id_user, id_extra_type, id_team, id_player)
        SELECT ?, ?, ?, ?
        FROM extra_bets
        WHERE ? > UNIX_TIMESTAMP()
        ON DUPLICATE KEY UPDATE
        id_team = VALUES(id_team),
        id_player = VALUES(id_player)`,
      [idUser, idExtraType, idTeam, idPlayer, seasonStart]
    );
  }
}

export default ExtraBetClass;
