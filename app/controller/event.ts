import axios from "axios";

// Classes
import MatchClass, { IMatch } from "../classes/match";
import { IPlayer } from "../classes/player";
import { ITeam } from "../classes/team";
import { myCache } from "../utilities/cache";

// Constants
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from "../const/error_codes";
import { MATCH_EVENT_TYPES } from "../const/matchEvents";
import EventsClass from "../classes/events";

const getMatchEvent = (fifaMatchEvent: number) => {
  switch (fifaMatchEvent) {
    case 1: {
      return MATCH_EVENT_TYPES.PENALTY_GOAL;
    }
    case 2: {
      return MATCH_EVENT_TYPES.GOAL;
    }
    default: {
      return MATCH_EVENT_TYPES.GOAL;
    }
  }
}

export const formatFifaGoals = (fifaGoalsObj: any[], players: IPlayer[], matchId: number | null) => {
  if (!fifaGoalsObj || !matchId || fifaGoalsObj.length === 0) {
    return [];
  }

  return fifaGoalsObj.map((event: any) => {
    const player = players.find((player) => player.idFifa == event.IdPlayer)
    // const player_two = event.IdAssistPlayer ? players.find((player) => player.idFifa == event.IdAssistPlayer) : null;

    return {
      eventType: getMatchEvent(event.Type),
      gametime: event.Minute,
      playerId: player?.id,
      playerFifaId: event.IdPlayer,
      playerTwoId: null,
      playerTwoFifaId: event.IdAssistPlayer,
      matchId: matchId
    }
  })
};

exports.getAllMatchEvents = async (req: any, res: any) => {
  const eventInstance = new EventsClass(req, res);
  let matches: IMatch[] = [];
  let players: IPlayer[] = [];
  let teams: ITeam[] = [];

  if (myCache.has('matches') && myCache.has('teams') && myCache.has('players')) {
    matches = myCache.get('matches');
    players = myCache.get('players');
    teams = myCache.get('teams');
  } else {
    eventInstance.error.setResult([ERROR_CODES.CACHE_ERROR]);
    return eventInstance.error.returnApi();
  }

  try {
    let allQueries: any[] = [];
    matches.forEach((match) => {
      if (match.round <= 2) {
        allQueries.push(
          axios.get(`https://api.fifa.com/api/v3/live/football/17/255711/285063/${match.idFifa}?language=en`)
        );
      }
    })

    const allResults = await Promise.allSettled(allQueries);
    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      eventInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return eventInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    const eventsArray: any[] = [];
    fulfilledValues.forEach((item) => {
      const match = matches.find((singleMatch) => singleMatch.idFifa == item.data.IdMatch);
      const matchId = match ? match.id : null;

      if (item.data.HomeTeam.Goals && item.data.HomeTeam.Goals.length > 0) {
        const formattedGoals = formatFifaGoals(item.data.HomeTeam.Goals, players, matchId);
        eventsArray.push(...formattedGoals);
      }
      if (item.data.AwayTeam.Goals && item.data.AwayTeam.Goals.length > 0) {
        const formattedGoals = formatFifaGoals(item.data.AwayTeam.Goals, players, matchId);
        eventsArray.push(...formattedGoals);
      }
    });

    eventsArray.forEach((event) => eventInstance.insert(
      event.eventType,
      event.playerId,
      event.playerTwoId,
      event.gametime,
      event.matchId
    ));


    eventInstance.success.setResult(eventsArray);
    return eventInstance.success.returnApi();
  } catch (error: unknown) {
    eventInstance.error.catchError(error);
    return eventInstance.error.returnApi();
  }
}