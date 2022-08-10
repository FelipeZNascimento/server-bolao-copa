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
  idMatch: number;
  user: IUser;
  goalsHome: number;
  goalsAway: number;
  timestamp: string;
}

class BetClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  bets: IBet[];
  loggedUserBets: IBet | null;

  constructor(req: any, res: any) {
    super();

    this.error = new ErrorClass([], req, res);
    this.success = new SuccessClass([], req, res);

    this.bets = [];
    this.loggedUserBets = null;
  }

  pushBets(betsRaw: IBetRaw[], isLoggedUserBets: boolean = false) {
    betsRaw.forEach((betRaw) => {
      const formattedBet = {
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

      if (isLoggedUserBets) {
        this.loggedUserBets = formattedBet;
      } else {
        this.bets.push(formattedBet);
      }
    });
  }

  async getAll() {
    return super.runQuery(
      `SELECT bets.id, bets.id_match, bets.id_user, bets.goals_home, bets.goals_away,
        bets.timestamp, users_info.nickname as user_nickname, users_info.name as user_name,
        users_info.is_active as user_is_active
        FROM bets
        LEFT JOIN users_info ON bets.id_user = users_info.id_user
        LEFT JOIN matches ON bets.id_match = matches.id
        WHERE matches.timestamp <= UNIX_TIMESTAMP()`,
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
}

export default BetClass;
