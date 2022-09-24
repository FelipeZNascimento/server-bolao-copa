import BetClass, { IBetRaw } from '../classes/bet';
import ConfigClass from '../classes/config';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass, { ITeamRaw } from '../classes/team';
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
      betInstance.getAll().then((res) => ({ res: res, promiseContent: 'bets' }))
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

    const allRawBets = fulfilledValues.find(
      (item) => item.promiseContent === 'bets'
    ).res;

    const allBets = allRawBets.map((bet: IBetRaw) =>
      betInstance.formatRawBet(bet)
    );
    betInstance.setBets(allBets);

    if (myCache.has('teams')) {
      teamInstance.setTeams(myCache.get('teams'));
    } else {
      const allTeamsRaw: ITeamRaw[] = fulfilledValues.find(
        (item) => item.promiseContent === 'teams'
      ).res;
      const formattedTeams = allTeamsRaw.map((team) =>
        teamInstance.formatRawTeam(team)
      );
      teamInstance.setTeams(formattedTeams);
      myCache.set('teams', teamInstance.teams, 60 * 60 * 24);
    }

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
