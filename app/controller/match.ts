import BetClass, { IBetRaw } from '../classes/bet';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass, { ITeamRaw } from '../classes/team';
import UserClass from '../classes/user';
import { UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { myCache } from '../utilities/cache';
// import axios from 'axios';
import { FINISHED_GAME } from '../const/matchStatus';

exports.listAll = async (req: any, res: any) => {
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
        betInstance.bets,
        betInstance.loggedUserBets
      );
      matchInstance.setMatches(mergedMatches);
      myCache.setMatches(allMatches);
    }

    matchInstance.success.setResult(matchInstance.matches);
    return matchInstance.success.returnApi();
  } catch (error: unknown) {
    matchInstance.error.catchError(error);
    return matchInstance.error.returnApi();
  }
};

// exports.update = async (req: any, res: any) => {
//   const matchInstance = new MatchClass(req, res);

//   let matches = [];
//   if (myCache.has('matches')) {
//     matches = myCache.get('matches');
//   } else {
//     return;
//   }

//   const allFormattedMatches: any[] = [];
//   for (let i = 0; i < matches.length; i++) {
//     if (
//       FINISHED_GAME.includes(matches[i].status) ||
//       !matches[i].idFifa ||
//       matches[i].round > 3
//     ) {
//       return;
//     }

//     const response = await axios.get(
//       `https://api.fifa.com/api/v3/live/football/17/255711/285063/${matches[i].idFifa}?language=en`
//     );

//     if (!response || !response.data) {
//       return;
//     }

//     const matchObj = response.data;
//     const formattedMatchObj = {
//       id: matches[i].idFifa,
//       home: {
//         name: matchObj.HomeTeam.TeamName[0].Description,
//         score: matchObj.HomeTeam.Score
//       },
//       away: {
//         name: matchObj.AwayTeam.TeamName[0].Description,
//         score: matchObj.AwayTeam.Score
//       }
//     };
//     allFormattedMatches.push(formattedMatchObj);
//   }

//   // NOT WORKING - ASYNC/AWAIT ISSUES
//   // THIS IS BEING SET BEFORE AXIOS GETS INFO
//   matchInstance.success.setResult(allFormattedMatches);
//   return matchInstance.success.returnApi();
// };

// https://api.fifa.com/api/v3/live/football/17/255711/285063/400235486?language=en
// https://api.fifa.com/api/v3/live/football/17/255711/285063/{match.id}?language=en
