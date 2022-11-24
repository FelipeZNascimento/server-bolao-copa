import BetClass, { IBetRaw } from '../classes/bet';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass, { ITeamRaw } from '../classes/team';
import UserClass from '../classes/user';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { myCache } from '../utilities/cache';
import axios from 'axios';
import { FINISHED_GAME, FOOTBALL_MATCH_STATUS, STOPPED_GAME } from '../const/matchStatus';
import { IReferee } from '../classes/referee';

const getStatus = (fifaStatus: number) => {
  switch (fifaStatus) {
    case 0: {
      return FOOTBALL_MATCH_STATUS.NOT_STARTED;
    }
    case 3: {
      return FOOTBALL_MATCH_STATUS.FIRST_HALF;
    }
    case 4: {
      return FOOTBALL_MATCH_STATUS.HALFTIME;
    }
    case 5: {
      return FOOTBALL_MATCH_STATUS.SECOND_HALF;
    }
    case 10: {
      return FOOTBALL_MATCH_STATUS.FINAL;
    }
    default: {
      return FOOTBALL_MATCH_STATUS.NOT_STARTED;
    }
  }

}

exports.listAll = async (req: any, res: any) => {
  const isOnlyCurrent = req.originalUrl.indexOf('current') === -1 ? false : true;

  const matchInstance = new MatchClass(req, res);
  const teamInstance = new TeamClass(req, res);
  const betInstance = new BetClass({}, req, res);
  const userInstance = new UserClass({}, req, res);
  const loggedUser = req.session.user;
  if (loggedUser) {
    userInstance.updateTimestamp(loggedUser.id);
  }
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

    if (loggedUser) {
      allQueries.push(
        betInstance
          .getFromLoggedUser(loggedUser.id)
          .then((res) => ({ res: res, promiseContent: 'userBets' }))
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

    if (loggedUser) {
      const allRawUserBets = fulfilledValues.find(
        (item) => item.promiseContent === 'userBets'
      ).res;

      const allUserBets = allRawUserBets.map((bet: IBetRaw) =>
        betInstance.formatRawBet(bet)
      );

      betInstance.setLoggedUserBets(allUserBets);
      betInstance.loggedUserBets;
    }

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
        betInstance.bets,
        betInstance.loggedUserBets
      );
      matchInstance.setMatches(mergedMatches, isOnlyCurrent);
    } else {
      const allRawMatches = fulfilledValues.find(
        (item) => item.promiseContent === 'matches'
      ).res;
      const allMatches = allRawMatches.map((match: IMatchRaw) =>
        matchInstance.formatRawMatch(match)
      );

      const mergedMatches = matchInstance.mergeBets(
        allMatches,
        betInstance.bets,
        betInstance.loggedUserBets
      );
      matchInstance.setMatches(mergedMatches, isOnlyCurrent);
      myCache.setMatches(allMatches);
    }

    matchInstance.success.setResult(matchInstance.matches);
    return matchInstance.success.returnApi();
  } catch (error: unknown) {
    matchInstance.error.catchError(error);
    return matchInstance.error.returnApi();
  }
};

const hasFifteenMinutesPassed = (matchTimestamp: number) => {
  const updateTime = new Date(matchTimestamp);
  const nowTime = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  updateTime.setTime(updateTime.getTime() + 5 * 1000 * 60 * 60);
  return updateTime.getTime() + fifteenMinutes < nowTime;
}

const isMatchTwelveHoursDistance = (matchTimestamp: string) => {
  const matchTime = new Date(matchTimestamp);
  matchTime.setTime(matchTime.getTime() + 5 * 1000 * 60 * 60);
  const nowTime = Date.now();

  const twelveHours = 12 * 1000 * 60 * 60;
  const twelveHoursAgo = nowTime - twelveHours;
  const twelveHoursAhead = nowTime + twelveHours;

  return matchTime.getTime() > twelveHoursAgo && matchTime.getTime() < twelveHoursAhead;
}

exports.update = async (req: any, res: any) => {
  const matchInstance = new MatchClass(req, res);

  let matches: IMatch[] = [];
  let referees: IReferee[] = [];
  if (myCache.has('matches') && myCache.has('referees')) {
    matches = myCache.get('matches');
    referees = myCache.get('referees');
  } else {
    matchInstance.error.setResult([ERROR_CODES.CACHE_ERROR]);
    return matchInstance.error.returnApi();
  }

  try {
    let allQueries: any[] = [];
    matches.forEach((match) => {
      const lastUpdated = new Date(match.lastUpdated).getTime();
      if (
        !FINISHED_GAME.includes(match.status) &&
        match.round <= 3 &&
        isMatchTwelveHoursDistance(match.timestamp)
      ) {
        // If game is stopped but +15min has passed since last update, fetch
        if (STOPPED_GAME.includes(match.status) && hasFifteenMinutesPassed(lastUpdated)) {
          allQueries.push(
            axios.get(`https://api.fifa.com/api/v3/live/football/17/255711/285063/${match.idFifa}?language=en`)
          );
        } else if (!STOPPED_GAME.includes(match.status)) { // If game is not stopped, fetch
          allQueries.push(
            axios.get(`https://api.fifa.com/api/v3/live/football/17/255711/285063/${match.idFifa}?language=en`)
          );
        }
      }

    })

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

    // const fifaMatches: any[] = fulfilledValues.map((item) => fifaMatches.push(item.data));

    const formattedMatchObj = fulfilledValues.map((item) => {
      const official = item.data.Officials.length > 0
        ? item.data.Officials.find((official: any) => official.OfficialType === 1)
        : null;
      let refereeId = null;
      if (official) {
        refereeId = referees.find((referee) => referee.idFifa == official.OfficialId)?.id;
      }

      const newStatus = getStatus(item.data.Period);
      return {
        fifaId: item.data.IdMatch,
        refereeId: refereeId || null,
        matchTime: item.data.MatchTime,
        matchStatus: newStatus,
        home: {
          name: item.data.HomeTeam.TeamName[0].Description,
          score: item.data.HomeTeam.Score,
          penalties: item.data.HomeTeamPenaltyScore,
          possession: item.data.BallPossession.OverallHome || 0
        },
        away: {
          name: item.data.AwayTeam.TeamName[0].Description,
          score: item.data.AwayTeam.Score,
          penalties: item.data.AwayTeamPenaltyScore,
          possession: item.data.BallPossession.OverallAway || 0
        }
      }
    }
    );

    formattedMatchObj.forEach((item) => matchInstance.update(
      item.fifaId,
      item.home.score,
      item.home.penalties,
      item.home.possession,
      item.away.score,
      item.away.penalties,
      item.away.possession,
      item.refereeId,
      item.matchTime,
      item.matchStatus
    ));

    matchInstance.success.setResult(formattedMatchObj);
    return matchInstance.success.returnApi();
  } catch (error: unknown) {
    matchInstance.error.catchError(error);
    return matchInstance.error.returnApi();
  }
};

// https://api.fifa.com/api/v3/live/football/17/255711/285063/400235486?language=en
// https://api.fifa.com/api/v3/live/football/17/255711/285063/{match.id}?language=en
