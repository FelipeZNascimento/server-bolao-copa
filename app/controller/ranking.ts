import BetClass, { IBetRaw } from '../classes/bet';
import ExtraBetClass, {
  IExtraBetRaw,
  IExtraBetResults
} from '../classes/extraBet';
import MatchClass, { IMatchRaw } from '../classes/match';
import RankingClass from '../classes/ranking';
import UserClass, { IUserRaw } from '../classes/user';
import { UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { myCache } from '../utilities/cache';

exports.listAll = async (req: any, res: any) => {
  const extraBetInstance = new ExtraBetClass(req, res);
  const betInstance = new BetClass({}, req, res);
  const matchInstance = new MatchClass(req, res);
  const rankingInstance = new RankingClass(req, res);
  const userInstance = new UserClass({}, req, res);
  const loggedUser = req.session.user;
  const seasonStartTimestamp = myCache.get('seasonStart');
  const teams = myCache.get('teams');

  if (loggedUser) {
    userInstance.updateTimestamp(loggedUser.id);
  }

  try {
    const allQueries = [
      userInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'users' })),
      betInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'bets' })),
      extraBetInstance
        .getAll(seasonStartTimestamp)
        .then((res) => ({ res: res, promiseContent: 'extraBets' })),
      extraBetInstance
        .getResults(seasonStartTimestamp)
        .then((res) => ({ res: res, promiseContent: 'extraBetsResults' }))
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

    let formattedUsers = allUsers.map((user) =>
      userInstance.formatRawUser(user)
    );

    if (loggedUser) {
      const currentUser = formattedUsers.find(
        (user) => user.id === loggedUser.id
      );
      if (currentUser && currentUser.isActive !== loggedUser.isActive) {
        req.session.user = currentUser;
      }
    }

    formattedUsers = formattedUsers.filter((item) => item.isActive);

    const allRawBets: IBetRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'bets'
    ).res;

    const allBets = allRawBets.map((bet: IBetRaw) =>
      betInstance.formatRawBet(bet)
    );
    betInstance.setBets(allBets);

    const allExtraBetsResults: IExtraBetResults[] = fulfilledValues.find(
      (item) => item.promiseContent === 'extraBetsResults'
    ).res;

    const allRawExtraBets: IExtraBetRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'extraBets'
    ).res;

    const allExtraBets = allRawExtraBets.map((extraBet: IExtraBetRaw) =>
      extraBetInstance.formatRawExtraBet(extraBet, teams)
    );
    extraBetInstance.setExtraBets(allExtraBets);

    if (myCache.has('matches')) {
      const mergedMatches = matchInstance.mergeBetsAndEvents(
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

      const mergedMatches = matchInstance.mergeBetsAndEvents(
        allMatches,
        betInstance.bets
      );
      matchInstance.setMatches(mergedMatches);
      myCache.setMatches(matchInstance.matches);
    }
    rankingInstance.prepareUsers(formattedUsers);
    rankingInstance.buildRanking(
      matchInstance.matches,
      allExtraBets,
      allExtraBetsResults
    );

    rankingInstance.success.setResult(rankingInstance.ranking);
    return rankingInstance.success.returnApi();
  } catch (error: unknown) {
    rankingInstance.error.catchError(error);
    return rankingInstance.error.returnApi();
  }
};
