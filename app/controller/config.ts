import BetClass from '../classes/bet';
import ConfigClass from '../classes/config';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass from '../classes/team';
import { UNKNOWN_ERROR_CODE } from '../const/error_codes';
const myCache = require('../utilities/cache');

exports.default = async (req: any, res: any) => {
  const loggedUser = req.session.user;
  const configInstance = new ConfigClass(req, res);
  configInstance.setLoggedUser(loggedUser);
  try {
    const matchInstance = new MatchClass(req, res);
    const teamInstance = new TeamClass(req, res);
    const betInstance = new BetClass({}, req, res);

    const allQueries = [
      betInstance.getAll(),
      betInstance.getFromLoggedUser(loggedUser ? loggedUser.id : null)
    ];

    if (!myCache.has('teams')) {
      allQueries.push(
        teamInstance
          .getAll()
          .then((res) => ({ res: res, promiseContent: 'teams' }))
      );
    }

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
      configInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return configInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    betInstance.pushBets(fulfilledValues[0], false); // All available bets
    betInstance.pushBets(fulfilledValues[1], true); // All loggedUserBets

    if (myCache.has('teams')) {
      teamInstance.setTeams(myCache.get('teams'));
    } else {
      const promiseReturn = fulfilledValues.find(
        (item) => item.promiseContent === 'teams'
      );
      teamInstance.pushTeams(promiseReturn.res);
      myCache.set('teams', teamInstance.teams, 60 * 60 * 24);
    }

    const bets = betInstance.bets;
    const loggedUserBets = betInstance.loggedUserBets;

    if (myCache.has('matches')) {
      matchInstance.pushMatches(myCache.get('matches'), bets, loggedUserBets);
    } else {
      const promiseReturn = fulfilledValues.find(
        (item) => item.promiseContent === 'matches'
      );
      matchInstance.pushMatchesRaw(promiseReturn.res, bets, loggedUserBets);
      myCache.set('matches', matchInstance.matches, 10);
    }

    if (!myCache.has('seasonStart')) {
      const matches = matchInstance.matches;

      const seasonStart = matches.reduce((prev: IMatch, curr: IMatch) =>
        prev.timestamp <= curr.timestamp ? prev : curr
      );

      const seasonStartTimestamp =
        new Date(seasonStart.timestamp).getTime() / 1000;
      myCache.set('seasonStart', seasonStartTimestamp, 60 * 60 * 24);
    }

    configInstance.setSeasonStart(myCache.get('seasonStart'));
    configInstance.setMatches(matchInstance.matches);
    configInstance.setTeams(teamInstance.teams);
    const buildObject = configInstance.buildConfigObject();
    configInstance.success.setResult(buildObject);
    return configInstance.success.returnApi();
  } catch (error: unknown) {
    configInstance.error.catchError(error);
    return configInstance.error.returnApi();
  }
};
