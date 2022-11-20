import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import RefereeClass, { IRefereeRaw } from '../classes/referee';
import TeamClass, { ITeamRaw } from '../classes/team';
import { myCache } from '../utilities/cache';

exports.start = async () => {
  console.log('---------------');
  console.log('Starting up...');
  try {
    const matchInstance = new MatchClass();
    const teamInstance = new TeamClass();
    const refereeInstance = new RefereeClass();

    const allQueries = [
      teamInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'teams' })),
      matchInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'matches' })),
      refereeInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'referees' }))
    ];

    const allResults = await Promise.allSettled(allQueries);

    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      console.log(rejectedReasons);
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    const allTeamsRaw: ITeamRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'teams'
    ).res;

    const allMatchesRaw = fulfilledValues.find(
      (item) => item.promiseContent === 'matches'
    ).res;
    const formattedTeams = allTeamsRaw.map((team) =>
      teamInstance.formatRawTeam(team)
    );

    const formattedMatches = allMatchesRaw.map((match: IMatchRaw) =>
      matchInstance.formatRawMatch(match)
    );

    const allRefereesRaw = fulfilledValues.find(
      (item) => item.promiseContent === 'referees'
    ).res;

    const formattedReferees = allRefereesRaw.map((referee: IRefereeRaw) =>
      refereeInstance.formatRawReferee(referee)
    );

    myCache.setTeams(formattedTeams);
    myCache.setMatches(formattedMatches);
    myCache.setReferees(formattedReferees);

    const seasonStart = formattedMatches.reduce(
      (prev: IMatch, curr: IMatch) =>
        prev.timestamp <= curr.timestamp ? prev : curr
    );

    const seasonStartTimestamp =
      new Date(seasonStart.timestamp).getTime() / 1000;
    myCache.setSeasonStart(seasonStartTimestamp);
    console.log('Startup complete.');
    console.log('---------------');
  } catch (error: unknown) {
    console.log('---Error on startup---');
    console.log('---------------');
    console.log(error);
  }
};
