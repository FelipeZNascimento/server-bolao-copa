import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IUser } from './user';
import { ITeam } from './team';
import { IPlayer, IPlayerRaw } from './player';

export interface IExtraBetResults {
  id_champion: number | null;
  id_offense: number | null;
  id_defense: number | null;
  id_striker: number | null;
}

export interface IExtraBetRaw extends IPlayerRaw {
  id: number;
  id_match: number;
  id_user: number;
  id_extra_type: number;
  id_team: number | null;
  timestamp: string;
  user_nickname: string;
  user_name: string;
  user_is_active: boolean;
  user_last_timestamp: string;
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
  idTeam?: number | null;
  idPlayer?: number | null;
  team: ITeam | null;
  timestamp: string;
  player: IPlayer | null;
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
      user: {
        id: extraBetRaw.id_user,
        name: extraBetRaw.user_name,
        nickname: extraBetRaw.user_nickname,
        isActive: extraBetRaw.user_is_active,
        lastTimestamp: extraBetRaw.user_last_timestamp
      },
      player: {
        id: extraBetRaw.player_id,
        name: extraBetRaw.player_name,
        number: extraBetRaw.player_number,
        birth: extraBetRaw.player_date_of_birth,
        height: extraBetRaw.player_height,
        weigth: extraBetRaw.player_weight,
        position: {
          id: extraBetRaw.position_id,
          description: extraBetRaw.position_description,
          abbreviation: extraBetRaw.position_abbreviation
        },
        team: team !== undefined ? team : null
      },
      team: team !== undefined ? team : null
    };
  }

  async getAll(seasonStart: number) {
    return super.runQuery(
      `SELECT extra_bets.id, extra_bets.id_user, extra_bets.id_extra_type, extra_bets.id_team,
        extra_bets.id_player as player_id, extra_bets.timestamp,
        users_info.nickname as user_nickname, users_info.name as user_name,
        users_info.is_active as user_is_active, users_info.last_timestamp as user_last_timestamp,
        players.name as player_name, players.number as player_number, players.number,
        players.date_of_birth as player_date_of_birth, players.height as player_height, players.weight as player_weight,
        positions.id as position_id, positions.description as position_description, positions.abbreviation as position_abbreviation
        FROM extra_bets
        LEFT JOIN users_info ON extra_bets.id_user = users_info.id_user
        LEFT JOIN players ON players.id = extra_bets.id_player
        LEFT JOIN positions ON positions.id = players.id_position
        WHERE ? < UNIX_TIMESTAMP()`,
      [seasonStart]
    );
  }

  async getResults(seasonStart: number) {
    return super.runQuery(
      `SELECT id_champion, id_offense, id_defense, id_striker
        FROM extra_bets_results
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
        users_info.is_active as user_is_active,
        players.name as player_name, players.number as player_number
        FROM extra_bets
        LEFT JOIN users_info ON extra_bets.id_user = users_info.id_user
        LEFT JOIN players ON players.id = extra_bets.id_player
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
        FROM (SELECT 1) x
        WHERE ? > UNIX_TIMESTAMP()
        ON DUPLICATE KEY UPDATE
        id_team = VALUES(id_team),
        id_player = VALUES(id_player)`,
      [idUser, idExtraType, idTeam, idPlayer, seasonStart]
    );
  }
}

export default ExtraBetClass;
