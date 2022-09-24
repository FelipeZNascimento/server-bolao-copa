import BetClass, { IBet, IBetRaw } from '../classes/bet';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import RankingClass from '../classes/ranking';
import TeamClass from '../classes/team';
import UserClass, { IUser, IUserRaw } from '../classes/user';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
const myCache = require('../utilities/cache');

exports.listAll = async (req: any, res: any) => {
  const betInstance = new BetClass({}, req, res);
  const matchInstance = new MatchClass(req, res);
  const rankingInstance = new RankingClass(req, res);
  const userInstance = new UserClass({}, req, res);

  const loggedUser = req.session.user;
  try {
    const allQueries = [
      userInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'users' })),
      betInstance.getAll().then((res) => ({ res: res, promiseContent: 'bets' }))
    ];

    if (!myCache.has('matches')) {
      allQueries.push(
        matchInstance
          .getAll()
          .then((res) => ({ res: res, promiseContent: 'matches' }))
      );
    }

    const allResults = await Promise.allSettled(allQueries);
    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      rankingInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return rankingInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    const allUsers: IUserRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'users'
    ).res;
    const formattedUsers = allUsers.map((user) =>
      userInstance.formatRawUser(user)
    );
    const allRawBets: IBetRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'bets'
    ).res;

    const allBets = allRawBets.map((bet: IBetRaw) =>
      betInstance.formatRawBet(bet)
    );
    betInstance.setBets(allBets);

    if (myCache.has('matches')) {
      const mergedMatches = matchInstance.mergeBets(
        myCache.get('matches'),
        betInstance.bets
      );
      matchInstance.setMatches(mergedMatches);
    } else {
      const allRawMatches = fulfilledValues.find(
        (item) => item.promiseContent === 'matches'
      ).res;
      const allMatches = allRawMatches.map((match: IMatchRaw) =>
        matchInstance.formatRawMatch(match)
      );

      const mergedMatches = matchInstance.mergeBets(
        allMatches,
        betInstance.bets
      );
      matchInstance.setMatches(mergedMatches);
      myCache.set('matches', matchInstance.matches, 10);
    }
    rankingInstance.prepareUsers(formattedUsers);
    rankingInstance.buildRanking(matchInstance.matches);

    rankingInstance.success.setResult(rankingInstance.ranking);
    return rankingInstance.success.returnApi();
  } catch (error: unknown) {
    rankingInstance.error.catchError(error);
    return rankingInstance.error.returnApi();
  }
};
