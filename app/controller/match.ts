import BetClass, { IBetRaw } from '../classes/bet';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass, { ITeamRaw } from '../classes/team';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { myCache } from '../utilities/cache';

exports.listAll = async (req: any, res: any) => {
  const matchInstance = new MatchClass(req, res);
  const teamInstance = new TeamClass(req, res);
  const betInstance = new BetClass({}, req, res);
  try {
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
      matchInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return matchInstance.error.returnApi();
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
      myCache.setTeams(teamInstance.teams);
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
      myCache.setMatches(matchInstance.matches);
    }

    matchInstance.success.setResult(matchInstance.matches);
    return matchInstance.success.returnApi();
  } catch (error: unknown) {
    matchInstance.error.catchError(error);
    return matchInstance.error.returnApi();
  }
};
exports.listAllWithUserBets = async (req: any, res: any) => {
  const matchInstance = new MatchClass(req, res);
  const teamInstance = new TeamClass(req, res);
  const betInstance = new BetClass({}, req, res);

  const loggedUser = req.session.user;
  if (!loggedUser) {
    matchInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return matchInstance.error.returnApi(401);
  }
  try {
    const allQueries = [
      betInstance
        .getFromLoggedUser(loggedUser.id)
        .then((res) => ({ res: res, promiseContent: 'bets' }))
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
      matchInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return matchInstance.error.returnApi();
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
    betInstance.setLoggedUserBets(allBets);

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
      myCache.setTeams(teamInstance.teams);
    }

    if (myCache.has('matches')) {
      const mergedMatches = matchInstance.mergeBets(
        myCache.get('matches'),
        [],
        betInstance.loggedUserBets
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
        [],
        betInstance.loggedUserBets
      );
      matchInstance.setMatches(mergedMatches);
      myCache.setMatches(matchInstance.matches);
    }

    matchInstance.success.setResult(matchInstance.matches);
    return matchInstance.success.returnApi();
  } catch (error: unknown) {
    matchInstance.error.catchError(error);
    return matchInstance.error.returnApi();
  }
};
