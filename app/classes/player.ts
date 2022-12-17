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

export interface IClubRaw {
  club_country_name: string;
  club_country_name_en: string;
  club_country_abbreviation: string;
  club_country_abbreviation_en: string;
  club_country_iso_code: string;
  club_country_id: number;
  club_name: string;
}

export interface IClubCountry {
  id: number;
  name: string;
  nameEn: string;
  abbreviation: string;
  abbreviationEn: string;
  isoCode: string;
}
export interface IClub {
  name: string;
  country: IClubCountry;
}

export interface IPlayerRaw extends IPositionRaw, ITeamRaw, IClubRaw {
  player_id: number;
  player_id_fifa: number;
  player_id_fifa_picture: string;
  player_name: string;
  player_number: number;
  player_date_of_birth: string;
  player_height: number;
  player_weight: number;
}

export interface IPlayer {
  id: number;
  idFifa: number;
  idFifaPicture: string;
  name: string;
  number: number;
  birth?: string;
  height?: number;
  weigth?: number;
  position: IPosition;
  team?: ITeam | null;
  club?: IClub | null;
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

  formatRawPlayer(playerRaw: IPlayerRaw) {
    let club: IClub | null = null;
    if (playerRaw.club_name) {
      club = {
        name: playerRaw.club_name,
        country: {
          id: playerRaw.club_country_id,
          name: playerRaw.club_country_name,
          nameEn: playerRaw.club_country_name_en,
          abbreviation: playerRaw.club_country_abbreviation,
          abbreviationEn: playerRaw.club_country_abbreviation_en,
          isoCode: playerRaw.club_country_iso_code
        }
      };
    }

    return {
      id: playerRaw.player_id,
      idFifa: playerRaw.player_id_fifa,
      idFifaPicture: playerRaw.player_id_fifa_picture,
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
      },
      club: club
    };
  }

  async getAll() {
    return super.runQuery(
      `SELECT players.id as player_id, players.name as player_name, players.number as player_number, players.id_fifa as player_id_fifa,
        players.id_fifa_picture as player_id_fifa_picture,
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

  async getByTeam(teamId: number) {
    return super.runQuery(
      `SELECT players.id as player_id, players.name as player_name, players.number as player_number, players.id_fifa as player_id_fifa,
        players.id_fifa_picture as player_id_fifa_picture,
        players.date_of_birth as player_date_of_birth, players.height as player_height, players.weight as player_weight,
        positions.id as position_id, positions.description as position_description, positions.abbreviation as position_abbreviation,
        teams.id as team_id, teams.id_fifa as team_id_fifa, teams.group as team_group,
        countries.name as team_name, countries.name_en as team_name_en, countries.abbreviation as team_abbreviation,
        countries.abbreviation_en as team_abbreviation_en, countries.iso_code as team_iso_code,
        club_country.name as club_country_name, club_country.name_en as club_country_name_en,
        club_country.abbreviation as club_country_abbreviation,
        club_country.abbreviation_en as club_country_abbreviation_en, club_country.iso_code as club_country_iso_code,
        clubs.name as club_name, clubs.id as club_id, clubs.id_country as club_country_id,
        confederations.id as team_confederation_id, confederations.name as team_confederation_name,
        confederations.name_en as team_confederation_name_en,
        confederations.abbreviation as team_confederation_abbreviation,
        GROUP_CONCAT(DISTINCT teams_colors.color ORDER BY teams_colors.id) team_colors
        FROM players
        LEFT JOIN teams ON teams.id = players.id_team
        LEFT JOIN positions ON positions.id = players.id_position
        LEFT JOIN clubs ON clubs.id = players.id_club
        LEFT JOIN countries ON countries.id = teams.id_country
        LEFT JOIN countries AS club_country ON club_country.id = clubs.id_country
        LEFT JOIN confederations ON countries.id_confederation = confederations.id
        LEFT JOIN teams_colors ON teams_colors.id_team = teams.id
        WHERE teams.id = ?
        GROUP BY players.id
        ORDER BY position_id ASC, player_number ASC, player_name ASC`,
      [teamId]
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

  async updateFifaId(
    fifaId: number,
    teamId: number,
    shirtNumber: number
  ) {
    if (!teamId || !fifaId || !shirtNumber) {
      return;
    }

    return super.runQuery(
      `UPDATE players
        SET id_fifa = ?
        WHERE id_team = ? AND number = ?`,
      [fifaId, teamId, shirtNumber]
    );
  }

  async updateFifaPictureId(
    fifaPictureId: number,
    teamId: number,
    shirtNumber: number
  ) {
    if (!teamId || !fifaPictureId || !shirtNumber) {
      return;
    }

    return super.runQuery(
      `UPDATE players
        SET id_fifa_picture = ?
        WHERE id_team = ? AND number = ?`,
      [fifaPictureId, teamId, shirtNumber]
    );
  }

}

export default PlayerClass;
