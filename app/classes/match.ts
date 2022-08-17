import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IBet } from './bet';

interface ITeam {
  id: number;
  goals: number;
  penalties: number;
  name: string;
  nameEn: string;
  abbreviation: string;
  confederation: IConfederation;
  group: string;
  colors: string[];
}

interface IStadium {
  id: number;
  name: string;
  city: string;
  capacity: number;
  latitude: string;
  longitude: string;
}

interface IConfederation {
  id: number;
  abbreviation: string;
  name: string;
  nameEn: string;
}

interface ICountry {
  id: number;
  abbreviation: string;
  name: string;
  nameEn: string;
}

interface IReferee {
  id: number;
  name: string;
  birth: string;
  country: ICountry;
}

export interface IMatchRaw {
  id: number;
  timestamp: string;
  round: number;
  status: number;
  home_id: number;
  away_id: number;
  goals_home: number;
  goals_away: number;
  penalties_home: number;
  penalties_away: number;
  id_stadium: number;
  id_referee: number;
  home_name: string;
  home_name_en: string;
  home_name_abbreviation: string;
  home_group: string;
  home_id_confederation: string;
  away_name: string;
  away_name_en: string;
  away_name_abbreviation: string;
  away_group: string;
  away_id_confederation: string;
  referee_name: string;
  referee_birth: string;
  referee_id_country: number;
  stadium_name: string;
  stadium_city: string;
  stadium_capacity: number;
  stadium_geo_latitude: string;
  stadium_geo_longitude: string;
  home_confederation_id: number;
  home_confederation_abbreviation: string;
  home_confederation_name: string;
  home_confederation_name_en: string;
  away_confederation_id: number;
  away_confederation_abbreviation: string;
  away_confederation_name: string;
  away_confederation_name_en: string;
  referee_country_name: string;
  referee_country_name_en: string;
  referee_country_abbreviation: string;
  home_team_colors: string;
  away_team_colors: string;
}

export interface IMatch {
  id: number;
  timestamp: string;
  round: number;
  status: number;
  bets: IBet[];
  loggedUserBets: IBet | null;
  homeTeam: ITeam;
  awayTeam: ITeam;
  stadium: IStadium;
  referee: IReferee;
}

export interface IRound {
  round: number;
  matches: IMatch[];
}

class MatchClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  matches: IMatch[];
  matchesByRound: IRound[];

  constructor(req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.matches = [];
    this.matchesByRound = [];
  }

  pushMatches(
    matchesRaw: IMatchRaw[],
    bets: IBet[] = [],
    loggedUserBets: IBet[] = []
  ) {
    matchesRaw.forEach((matchRaw: IMatchRaw) => {
      const matchBets = bets.filter((bet) => bet.idMatch === matchRaw.id);
      const matchLoggedUserBets = loggedUserBets.filter(
        (bet) => bet.idMatch === matchRaw.id
      );

      const formattedMatch: IMatch = {
        id: matchRaw.id,
        timestamp: matchRaw.timestamp,
        round: matchRaw.round,
        status: matchRaw.status,
        bets: matchBets,
        loggedUserBets:
          matchLoggedUserBets.length > 0 ? matchLoggedUserBets[0] : null,
        homeTeam: {
          id: matchRaw.home_id,
          name: matchRaw.home_name,
          nameEn: matchRaw.home_name_en,
          abbreviation: matchRaw.home_name_abbreviation,
          colors:
            matchRaw.home_team_colors === null
              ? []
              : matchRaw.home_team_colors.split(','),
          goals: matchRaw.goals_home,
          penalties: matchRaw.penalties_home,
          group: matchRaw.home_group,
          confederation: {
            id: matchRaw.home_confederation_id,
            abbreviation: matchRaw.home_confederation_abbreviation,
            name: matchRaw.home_confederation_name,
            nameEn: matchRaw.home_confederation_name_en
          }
        },
        awayTeam: {
          id: matchRaw.away_id,
          name: matchRaw.away_name,
          nameEn: matchRaw.away_name_en,
          abbreviation: matchRaw.away_name_abbreviation,
          colors:
            matchRaw.away_team_colors === null
              ? []
              : matchRaw.away_team_colors.split(','),
          goals: matchRaw.goals_away,
          penalties: matchRaw.penalties_away,
          group: matchRaw.away_group,
          confederation: {
            id: matchRaw.away_confederation_id,
            abbreviation: matchRaw.away_confederation_abbreviation,
            name: matchRaw.away_confederation_name,
            nameEn: matchRaw.away_confederation_name_en
          }
        },
        referee: {
          id: matchRaw.id_referee,
          name: matchRaw.referee_name,
          birth: matchRaw.referee_birth,
          country: {
            id: matchRaw.referee_id_country,
            abbreviation: matchRaw.referee_country_abbreviation,
            name: matchRaw.referee_country_name,
            nameEn: matchRaw.referee_country_name_en
          }
        },
        stadium: {
          id: matchRaw.id_stadium,
          name: matchRaw.stadium_name,
          city: matchRaw.stadium_city,
          capacity: matchRaw.stadium_capacity,
          latitude: matchRaw.stadium_geo_latitude,
          longitude: matchRaw.stadium_geo_longitude
        }
      };

      this.matches.push(formattedMatch);

      const round = this.matchesByRound.find(
        (matchByRound) => matchByRound.round === formattedMatch.round
      );

      if (round) {
        round.matches.push(formattedMatch);
      } else {
        this.matchesByRound.push({
          round: formattedMatch.round,
          matches: [formattedMatch]
        });
      }
    });
  }

  async getAll() {
    return super.runQuery(
      `SELECT matches.id, matches.timestamp, matches.round, matches.goals_home, matches.goals_away,
        matches.penalties_home, matches.penalties_away, matches.id_referee, matches.id_stadium,
        matches.status,
        homeTeam.id as home_id, homeTeam.name as home_name, homeTeam.name_en as home_name_en,
        homeTeam.abbreviation as home_name_abbreviation, homeTeam.group as home_group,
        homeTeam.id_confederation as home_id_confederation,
        awayTeam.id as away_id, awayTeam.name as away_name, awayTeam.name_en as away_name_en,
        awayTeam.abbreviation as away_name_abbreviation, awayTeam.group as away_group,
        awayTeam.id_confederation as away_id_confederation,
        referees.name as referee_name, referees.date_of_birth as referee_birth,
        referees.id_country as referee_id_country,
        stadiums.name as stadium_name, stadiums.city as stadium_city,
        stadiums.capacity as stadium_capacity, stadiums.geo_latitude as stadium_geo_latitude,
        stadiums.geo_longitude as stadium_geo_longitude,
        homeConfederation.id as home_confederation_id, homeConfederation.name as home_confederation_name,
        homeConfederation.name_en as home_confederation_name_en, homeConfederation.abbreviation as home_confederation_abbreviation,
        awayConfederation.id as away_confederation_id, awayConfederation.name as away_confederation_name,
        awayConfederation.name_en as away_confederation_name_en, awayConfederation.abbreviation as away_confederation_abbreviation,
        refereeCountry.name as referee_country_name, refereeCountry.name_en as referee_country_name_en,
        refereeCountry.abbreviation as referee_country_abbreviation,
        GROUP_CONCAT(homeTeamColors.color ORDER BY homeTeamColors.id) home_team_colors,
        GROUP_CONCAT(awayTeamColors.color ORDER BY awayTeamColors.id) away_team_colors
        FROM matches
        LEFT JOIN teams as homeTeam ON matches.id_home = homeTeam.id
        LEFT JOIN teams as awayTeam ON matches.id_away = awayTeam.id
        LEFT JOIN referees ON matches.id_referee = referees.id
        LEFT JOIN stadiums ON matches.id_stadium = stadiums.id
        LEFT JOIN confederations as homeConfederation ON homeTeam.id_confederation = homeConfederation.id
        LEFT JOIN confederations as awayConfederation ON awayTeam.id_confederation = awayConfederation.id
        LEFT JOIN countries as refereeCountry ON referees.id_country = refereeCountry.id
        LEFT JOIN teams_colors as homeTeamColors ON homeTeamColors.id_team = matches.id_home
        LEFT JOIN teams_colors as awayTeamColors ON awayTeamColors.id_team = matches.id_away
        GROUP BY matches.id
        ORDER BY matches.timestamp ASC`,
      []
    );
  }
}

export default MatchClass;
