import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IUser } from './user';
import { IMatch, IRound } from './match';

export interface IConfig {
  loggedUser: IUser | null;
}

class ConfigClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  private loggedUser: IUser | null;
  private matches: IMatch[] | null;
  private matchesByRound: IRound[] | null;

  constructor(req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.loggedUser = null;
    this.matches = null;
    this.matchesByRound = null;
  }

  setLoggedUser(user: IUser) {
    this.loggedUser = user;
  }

  setMatches(matches: IMatch[]) {
    this.matches = matches;
  }

  buildConfigObject() {
    return {
      loggedUser: this.loggedUser,
      matches: this.matches
    };
  }
}

export default ConfigClass;
