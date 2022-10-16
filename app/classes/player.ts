import ErrorClass from './error';
import QueryMaker from './queryMaker';
import SuccessClass from './success';
import { ITeam, ITeamRaw } from './team';

export interface IPositionRaw {
  position_id: number;
  position_description: string;
  position_abbreviation: string;
}

export interface IPosition {
  id: number;
  description: string;
  abbreviation: string;
}

export interface IPlayerRaw extends IPositionRaw, ITeamRaw {
  player_id: number;
  player_name: string;
  player_number: number;
  player_date_of_birth: string;
  player_height: number;
  player_weight: number;
}

export interface IPlayer {
  id: number;
  name: string;
  number: number;
  birth: string;
  height: number;
  weigth: number;
  position: IPosition;
  team: ITeam | null;
}

class PlayerClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  players: IPlayer[];

  constructor(req?: any, res?: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.players = [];
  }

  setPlayers(players: IPlayer[]) {
    this.players = players;
  }

  formatRawTeam(playerRaw: IPlayerRaw) {
    return {
      id: playerRaw.player_id,
      name: playerRaw.player_name,
      number: playerRaw.player_number,
      birth: playerRaw.player_date_of_birth,
      height: playerRaw.player_height,
      weigth: playerRaw.player_weight,
      position: {
        id: playerRaw.position_id,
        description: playerRaw.position_description,
        abbreviation: playerRaw.position_abbreviation
      },
      team: {
        id: playerRaw.team_id,
        idFifa: playerRaw.team_id_fifa,
        isoCode: playerRaw.team_iso_code,
        name: playerRaw.team_name,
        nameEn: playerRaw.team_name_en,
        abbreviation: playerRaw.team_abbreviation,
        abbreviationEn: playerRaw.team_abbreviation_en,
        group: playerRaw.team_group,
        goals: null,
        penalties: null,
        colors:
          playerRaw.team_colors === null
            ? []
            : playerRaw.team_colors.split(','),
        confederation: {
          id: playerRaw.confederation_id,
          abbreviation: playerRaw.confederation_abbreviation,
          name: playerRaw.confederation_name,
          nameEn: playerRaw.confederation_name_en
        }
      }
    };
  }

  async getAll() {
    return super.runQuery(
      `SELECT players.id as player_id, players.name as player_name, players.number as player_number,
        players.date_of_birth as player_date_of_birth, players.height as player_height, players.weight as player_weight,
        positions.id as position_id, positions.description as position_description, positions.abbreviation as position_abbreviation,
        teams.id as team_id, teams.id_fifa as team_id_fifa, teams.group as team_group,
        countries.name as team_name, countries.name_en as team_name_en, countries.abbreviation as team_abbreviation,
        countries.abbreviation_en as team_abbreviation_en, countries.iso_code as team_iso_code, 
        confederations.id as team_confederation_id, confederations.name as team_confederation_name,
        confederations.name_en as team_confederation_name_en,
        confederations.abbreviation as team_confederation_abbreviation,
        GROUP_CONCAT(DISTINCT teams_colors.color ORDER BY teams_colors.id) team_colors
        FROM players
        LEFT JOIN teams ON teams.id = players.id_team
        LEFT JOIN positions ON positions.id = players.id_position
        LEFT JOIN countries ON countries.id = teams.id_country
        LEFT JOIN confederations ON countries.id_confederation = confederations.id
        LEFT JOIN teams_colors ON teams_colors.id_team = teams.id
        GROUP BY players.id
        ORDER BY player_name ASC`
    );
  }

  async getById(id: ITeam['id']) {
    if (id === null) {
      return [];
    }

    return super.runQuery(
      `SELECT teams.id, teams.group,
      countries.id_confederation, countries.name, countries.name_en, countries.abbreviation,
      countries.abbreviation_en, countries.iso_code, 
      confederations.id as confederation_id, confederations.name as confederation_name,
      confederations.name_en as confederation_name_en,
      confederations.abbreviation as confederation_abbreviation,
      GROUP_CONCAT(DISTINCT teams_colors.color ORDER BY teams_colors.id) colors
      FROM teams
      LEFT JOIN countries ON countries.id = teams.id_country
      LEFT JOIN confederations ON countries.id_confederation = confederations.id
      LEFT JOIN teams_colors ON teams_colors.id_team = teams.id
      WHERE teams.id = ?
      GROUP BY teams.id
      ORDER BY countries.name ASC`,
      [id]
    );
  }
}

export default PlayerClass;
