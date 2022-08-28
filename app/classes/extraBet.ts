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

export interface IExtraBet {
  id: number;
  idExtraType: number;
  idPlayer: number | null;
  idTeam?: number | null;
  idUser?: number | null;
  team: ITeam | null;
  timestamp: string;
  user: IUser;
}

class ExtraBetClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  id: number | null;
  idExtraType: number | null;
  idPlayer: number | null;
  idTeam: number | null;
  idUser: number | null;
  team: ITeam | null;

  extraBets: IExtraBet[];
  loggedUserExtraBets: IExtraBet[];

  constructor(bet: Partial<IExtraBet>, req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.id = bet.id !== undefined ? Number(bet.id) : null;
    this.idExtraType =
      bet.idExtraType !== undefined ? Number(bet.idExtraType) : null;
    this.idTeam = bet.idTeam !== undefined ? Number(bet.idTeam) : null;
    this.idPlayer = bet.idPlayer !== undefined ? Number(bet.idPlayer) : null;
    this.idUser = bet.idUser !== undefined ? Number(bet.idUser) : null;
    this.team = null;

    this.extraBets = [];
    this.loggedUserExtraBets = [];
  }

  buildConfigObject() {
    return {
      extraBets: this.extraBets,
      loggedUserExtraBets: this.loggedUserExtraBets
    };
  }

  pushBets(
    betsRaw: IExtraBetRaw[],
    teams: ITeam[],
    isLoggedUserBets: boolean = false
  ) {
    betsRaw.forEach((betRaw) => {
      const team = teams && teams.find((item) => item.id === betRaw.id_team);
      const formattedBet = {
        id: betRaw.id,
        timestamp: betRaw.timestamp,
        idExtraType: betRaw.id_extra_type,
        idPlayer: betRaw.id_player,
        user: {
          id: betRaw.id_user,
          name: betRaw.user_name,
          nickname: betRaw.user_nickname,
          isActive: betRaw.user_is_active
        },
        team: team !== undefined ? team : null
      };

      if (isLoggedUserBets) {
        this.loggedUserExtraBets.push(formattedBet);
      } else {
        this.extraBets.push(formattedBet);
      }
    });
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
