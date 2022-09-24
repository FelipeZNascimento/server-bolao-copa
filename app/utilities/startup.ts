import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import TeamClass, { ITeamRaw } from '../classes/team';
import { myCache } from '../utilities/cache';

exports.start = async () => {
  console.log('---------------');
  console.log('Starting up...');
  try {
    const matchInstance = new MatchClass();
    const teamInstance = new TeamClass();

    const allQueries = [
      teamInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'teams' })),
      matchInstance
        .getAll()
        .then((res) => ({ res: res, promiseContent: 'matches' }))
    ];

    const allResults = await Promise.allSettled(allQueries);
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

    teamInstance.setTeams(formattedTeams);
    matchInstance.setMatches(formattedMatches);
    myCache.setTeams(teamInstance.teams);
    myCache.setMatches(matchInstance.matches);

    const seasonStart = matchInstance.matches.reduce(
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
    console.log(error);
  }
};
