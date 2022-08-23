import ErrorClass from './error';
import QueryMaker from './queryMaker';
import SuccessClass from './success';

export interface IConfederation {
  id: number;
  abbreviation: string;
  name: string;
  nameEn: string;
}

export interface ITeamRaw {
  id: number;
  group: string;
  id_confederation: number;
  name: string;
  name_en: string;
  abbreviation: string;
  abbreviation_en: string;
  iso_code: string;
  confederation_id: number;
  confederation_name: string;
  confederation_name_en: string;
  confederation_abbreviation: string;
  colors: string;
}

export interface ITeam {
  id: number;
  isoCode: string;
  goals: number | null;
  penalties: number | null;
  name: string;
  nameEn: string;
  abbreviation: string;
  abbreviationEn: string;
  group: string;
  colors: string[];
  confederation: IConfederation;
}

class TeamClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  teams: ITeam[];

  constructor(req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.teams = [];
  }

  pushTeams(teamsRaw: ITeamRaw[]) {
    teamsRaw.forEach((matchRaw: ITeamRaw) => {
      const formattedTeam: ITeam = {
        id: matchRaw.id,
        isoCode: matchRaw.iso_code,
        goals: null,
        penalties: null,
        name: matchRaw.name,
        nameEn: matchRaw.name_en,
        abbreviation: matchRaw.abbreviation,
        abbreviationEn: matchRaw.abbreviation_en,
        group: matchRaw.group,
        colors: matchRaw.colors === null ? [] : matchRaw.colors.split(','),
        confederation: {
          id: matchRaw.confederation_id,
          abbreviation: matchRaw.confederation_abbreviation,
          name: matchRaw.confederation_name,
          nameEn: matchRaw.confederation_name_en
        }
      };

      this.teams.push(formattedTeam);
    });
  }

  async getAll() {
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
        WHERE teams.id != 0
        GROUP BY teams.id
        ORDER BY countries.name ASC`
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

export default TeamClass;
