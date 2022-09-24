import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IUser } from './user';

export interface IBetRaw {
  id: number;
  id_match: number;
  id_user: number;
  goals_home: number;
  goals_away: number;
  timestamp: string;
  user_nickname: string;
  user_name: string;
  user_is_active: boolean;
}

export interface IBet {
  id: number;
  goalsHome: number;
  goalsAway: number;
  idMatch: number;
  idUser?: number;
  timestamp: string;
  user: IUser;
}

export interface IExtraBet {
  id: number;
  idExtraType: number;
  idTeam: number | null;
  idPlayer: number | null;
  user: IUser;
  timestamp: string;
}

class BetClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  id: number | null;
  idMatch: number | null;
  idUser: number | null;
  goalsHome: number | null;
  goalsAway: number | null;

  bets: IBet[];
  loggedUserBets: IBet[];

  constructor(bet: Partial<IBet>, req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.id = Number.isInteger(bet.id) ? Number(bet.id) : null;
    this.idMatch = Number.isInteger(bet.idMatch) ? Number(bet.idMatch) : null;
    this.idUser = Number.isInteger(bet.idUser) ? Number(bet.idUser) : null;
    this.goalsHome = Number.isInteger(bet.goalsHome)
      ? Number(bet.goalsHome)
      : null;
    this.goalsAway = Number.isInteger(bet.goalsAway)
      ? Number(bet.goalsAway)
      : null;

    this.bets = [];
    this.loggedUserBets = [];
  }

  formatRawBet(betRaw: IBetRaw) {
    return {
      id: betRaw.id,
      idMatch: betRaw.id_match,
      goalsHome: betRaw.goals_home,
      goalsAway: betRaw.goals_away,
      timestamp: betRaw.timestamp,
      user: {
        id: betRaw.id_user,
        name: betRaw.user_name,
        nickname: betRaw.user_nickname,
        isActive: betRaw.user_is_active
      }
    };
  }

  setBets(bets: IBet[]) {
    this.bets = bets;
  }

  setLoggedUserBets(bets: IBet[]) {
    this.loggedUserBets = bets;
  }

  async getAll() {
    return super.runQuery(
      `SELECT bets.id, bets.id_match, bets.id_user, bets.goals_home, bets.goals_away,
        bets.timestamp, users_info.nickname as user_nickname, users_info.name as user_name,
        users_info.is_active as user_is_active
        FROM bets
        LEFT JOIN users_info ON bets.id_user = users_info.id_user
        LEFT JOIN matches ON bets.id_match = matches.id
        WHERE UNIX_TIMESTAMP(matches.timestamp) <= UNIX_TIMESTAMP()`,
      []
    );
  }

  async getFromLoggedUser(id: IUser['id']) {
    if (!id) {
      return [];
    }

    return super.runQuery(
      `SELECT bets.id, bets.id_match, bets.id_user, bets.goals_home, bets.goals_away,
        bets.timestamp, users_info.nickname as user_nickname, users_info.name as user_name,
        users_info.is_active as user_is_active
        FROM bets
        LEFT JOIN users_info ON bets.id_user = users_info.id_user
        LEFT JOIN matches ON bets.id_match = matches.id
        WHERE bets.id_user = ?`,
      [id]
    );
  }

  async update(
    idMatch: IBet['idMatch'],
    idUser: IUser['id'],
    goalsAway: IBet['goalsAway'] | null,
    goalsHome: IBet['goalsHome'] | null
  ) {
    return super.runQuery(
      `INSERT INTO bets (id_match, id_user, goals_home, goals_away)
        SELECT ?, ?, ?, ?
        FROM matches WHERE id = ? AND UNIX_TIMESTAMP(matches.timestamp) > UNIX_TIMESTAMP()
        ON DUPLICATE KEY UPDATE
        goals_home = VALUES(goals_home),
        goals_away = VALUES(goals_away)`,
      [idMatch, idUser, goalsHome, goalsAway, idMatch]
    );
  }

  async updateExtra(
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
        WHERE ? < UNIX_TIMESTAMP()
        ON DUPLICATE KEY UPDATE
        id_team = VALUES(id_team),
        id_player = VALUES(id_player)`,
      [idUser, idExtraType, idTeam, idPlayer, seasonStart]
    );
  }
}

export default BetClass;
