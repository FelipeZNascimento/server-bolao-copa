import MatchClass, { IMatch } from '../classes/match';
import TeamClass from '../classes/team';
const myCache = require('../utilities/cache');

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

    const teamsPromiseReturn = fulfilledValues.find(
      (item) => item.promiseContent === 'teams'
    );
    const matchesPromiseReturn = fulfilledValues.find(
      (item) => item.promiseContent === 'matches'
    );

    teamInstance.pushTeams(teamsPromiseReturn.res);
    myCache.set('teams', teamInstance.teams, 60 * 60 * 24);
    matchInstance.pushMatchesRaw(matchesPromiseReturn.res);
    myCache.set('matches', matchInstance.matches, 10);

    const matches = matchInstance.matches;

    const seasonStart = matches.reduce((prev: IMatch, curr: IMatch) =>
      prev.timestamp <= curr.timestamp ? prev : curr
    );

    const seasonStartTimestamp =
      new Date(seasonStart.timestamp).getTime() / 1000;
    myCache.set('seasonStart', seasonStartTimestamp, 60 * 60 * 24);
    console.log('Startup complete.');
    console.log('---------------');
  } catch (error: unknown) {
    console.log('---Error on startup---');
    console.log(error);
  }
};
