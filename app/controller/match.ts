import { myCache } from '../utilities/cache';
import axios from 'axios';

// Classes
import BetClass, { IBetRaw } from '../classes/bet';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass, { ITeam, ITeamRaw } from '../classes/team';
import UserClass from '../classes/user';
import PlayerClass, { IPlayer } from '../classes/player';
import { IReferee } from '../classes/referee';
import { formatFifaGoals } from './event';

// Constants
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { FINISHED_GAME, FOOTBALL_MATCH_STATUS } from '../const/matchStatus';
import EventsClass, { IEvent, IEventRaw } from '../classes/events';
import { BET_MULTIPLIER } from '../const/bet_values';

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
};

exports.listAll = async (req: any, res: any) => {
  const isOnlyCurrent =
    req.originalUrl.indexOf('current') === -1 ? false : true;

  const betInstance = new BetClass({}, req, res);
  const eventInstance = new EventsClass(req, res);
  const matchInstance = new MatchClass(req, res);
  const teamInstance = new TeamClass(req, res);
  const userInstance = new UserClass({}, req, res);

  const loggedUser = req.session.user;
  if (loggedUser) {
    userInstance.updateTimestamp(loggedUser.id);
  }
  try {
    const allQueries = [
      betInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'bets' })),
      eventInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'events' }))
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

    const allRawEvents = fulfilledValues.find(
      (item) => item.promiseContent === 'events'
    ).res;

    const allEvents = allRawEvents.map((event: IEventRaw) =>
      eventInstance.formatRawEvent(event)
    );

    eventInstance.setEvents(allEvents);

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
      const mergedMatches = matchInstance.mergeBetsAndEvents(
        myCache.get('matches'),
        betInstance.bets,
        betInstance.loggedUserBets,
        eventInstance.events
      );
      matchInstance.setMatches(mergedMatches, isOnlyCurrent);
    } else {
      const allRawMatches = fulfilledValues.find(
        (item) => item.promiseContent === 'matches'
      ).res;
      const allMatches = allRawMatches.map((match: IMatchRaw) =>
        matchInstance.formatRawMatch(match)
      );

      const mergedMatches = matchInstance.mergeBetsAndEvents(
        allMatches,
        betInstance.bets,
        betInstance.loggedUserBets,
        eventInstance.events
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

const isMatchToday = (matchTimestamp: string) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const matchDay = new Date(matchTimestamp).setHours(0, 0, 0, 0);

  return today === matchDay;
};

const getStageId = (round: number) => {
  switch (round) {
    case BET_MULTIPLIER.GROUP_1.ROUND:
    case BET_MULTIPLIER.GROUP_2.ROUND:
    case BET_MULTIPLIER.GROUP_3.ROUND: {
      return 285063;
    }
    case BET_MULTIPLIER.ROUND_OF_16.ROUND: {
      return 285073;
    }
    case BET_MULTIPLIER.ROUND_OF_8.ROUND: {
      return 285074;
    }
    case BET_MULTIPLIER.SEMI_FINALS.ROUND: {
      return 285075;
    }
    case BET_MULTIPLIER.FINALS.ROUND: {
      return 285077;
    }
    default: {
      return FOOTBALL_MATCH_STATUS.NOT_STARTED;
    }
  }
};

exports.update = async (req: any, res: any) => {
  const matchInstance = new MatchClass(req, res);

  let matches: IMatch[] = [];
  let players: IPlayer[] = [];
  let referees: IReferee[] = [];
  let teams: ITeam[] = [];

  if (
    myCache.has('matches') &&
    myCache.has('referees') &&
    myCache.has('players') &&
    myCache.has('teams')
  ) {
    matches = myCache.get('matches');
    players = myCache.get('players');
    referees = myCache.get('referees');
    teams = myCache.get('teams');
  } else {
    matchInstance.error.setResult([ERROR_CODES.CACHE_ERROR]);
    return matchInstance.error.returnApi();
  }

  try {
    let allQueries: any[] = [];
    matches.forEach((match) => {
      if (
        !FINISHED_GAME.includes(match.status) &&
        isMatchToday(match.timestamp)
      ) {
        const stage = match.id === 62 ? 285075 : getStageId(match.round);
        allQueries.push(
          axios.get(
            `https://api.fifa.com/api/v3/live/football/17/255711/${stage}/${match.idFifa}?language=en`
          )
        );
      }
    });

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

    const formattedMatchObj = fulfilledValues.map((item) => {
      const official =
        item.data.Officials.length > 0
          ? item.data.Officials.find(
              (official: any) => official.OfficialType === 1
            )
          : null;
      let refereeId = null;
      if (official) {
        refereeId = referees.find(
          (referee) => referee.idFifa == official.OfficialId
        )?.id;
      }

      const newStatus = getStatus(item.data.Period);
      const match = matches.find(
        (singleMatch) => singleMatch.idFifa == item.data.IdMatch
      );
      const matchId = match ? match.id : null;

      return {
        matchId: matchId,
        fifaId: item.data.IdMatch,
        refereeId: refereeId || null,
        matchTime: item.data.MatchTime,
        matchStatus: newStatus,
        home: {
          name: item.data.HomeTeam.TeamName[0].Description,
          score: item.data.HomeTeam.Score,
          penalties: item.data.HomeTeamPenaltyScore,
          possession: item.data.BallPossession.OverallHome || 0,
          goals: formatFifaGoals(item.data.HomeTeam.Goals, players, matchId)
        },
        away: {
          name: item.data.AwayTeam.TeamName[0].Description,
          score: item.data.AwayTeam.Score,
          penalties: item.data.AwayTeamPenaltyScore,
          possession: item.data.BallPossession.OverallAway || 0,
          goals: formatFifaGoals(item.data.AwayTeam.Goals, players, matchId)
        }
      };
    });

    formattedMatchObj.forEach((item) => {
      item.home.goals.forEach((goal) =>
        matchInstance.insertEvents(
          goal.eventType,
          goal.playerId || null,
          goal.playerTwoId,
          goal.gametime,
          item.matchId
        )
      );

      item.away.goals.forEach((goal) =>
        matchInstance.insertEvents(
          goal.eventType,
          goal.playerId || null,
          goal.playerTwoId,
          goal.gametime,
          item.matchId
        )
      );

      matchInstance.update(
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
      );
    });

    matchInstance.success.setResult(formattedMatchObj);
    return matchInstance.success.returnApi();
  } catch (error: unknown) {
    matchInstance.error.catchError(error);
    return matchInstance.error.returnApi();
  }
};

// https://api.fifa.com/api/v3/live/football/17/255711/285063/400235486?language=en
// https://api.fifa.com/api/v3/live/football/17/255711/285063/{match.id}?language=en
