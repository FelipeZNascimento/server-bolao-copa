import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IUser } from './user';
import { IMatch, IRound } from './match';
import { ITeam } from './team';

export interface IConfig {
  loggedUser: IUser | null;
}

class ConfigClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  private loggedUser: IUser | null;
  private matches: IMatch[] | null;
  private seasonStart: number | null;
  private teams: ITeam[] | null;

  constructor(req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.loggedUser = null;
    this.matches = null;
    this.seasonStart = null;
    this.teams = null;
  }

  setLoggedUser(user: IUser) {
    this.loggedUser = user;
  }

  setMatches(matches: IMatch[]) {
    this.matches = matches;
  }

  setTeams(teams: ITeam[]) {
    this.teams = teams;
  }

  setSeasonStart(timestamp: number) {
    this.seasonStart = timestamp;
  }

  buildConfigObject() {
    return {
      loggedUser: this.loggedUser,
      seasonStart: this.seasonStart,
      teams: this.teams
    };
  }
}

export default ConfigClass;
