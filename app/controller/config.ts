import ConfigClass from '../classes/config';
import MatchClass from '../classes/match';
import NewsClass, { TNews } from '../classes/news';
import TeamClass, { ITeamRaw } from '../classes/team';
import UserClass from '../classes/user';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { myCache } from '../utilities/cache';

exports.default = async (req: any, res: any) => {
  const loggedUser = req.session.user;
  const configInstance = new ConfigClass(req, res);
  const userInstance = new UserClass({}, req, res);
  configInstance.setLoggedUser(loggedUser);
  if (loggedUser) {
    userInstance.updateTimestamp(loggedUser.id);
  }

  try {
    const matchInstance = new MatchClass(req, res);
    const teamInstance = new TeamClass(req, res);

    const allQueries = [];

    if (!myCache.has('teams')) {
      allQueries.push(
        teamInstance
          .getAll()
          .then((res) => ({ res: res, promiseContent: 'teams' }))
      );
    }

    if (!myCache.has('seasonStart')) {
      allQueries.push(
        matchInstance
          .getFirst()
          .then((res) => ({ res: res, promiseContent: 'firstMatch' }))
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

    if (!myCache.has('seasonStart')) {
      const firstMatchRaw = fulfilledValues.find(
        (item) => item.promiseContent === 'firstMatch'
      ).res;

      const formattedFirstMatch = matchInstance.formatRawMatch(firstMatchRaw);
      const seasonStart = formattedFirstMatch.timestamp;
      const seasonStartTimestamp = new Date(seasonStart).getTime() / 1000;
      myCache.setSeasonStart(seasonStartTimestamp);
    }

    configInstance.setSeasonStart(myCache.get('seasonStart'));
    configInstance.setTeams(teamInstance.teams);
    const buildObject = configInstance.buildConfigObject();
    configInstance.success.setResult(buildObject);
    return configInstance.success.returnApi();
  } catch (error: unknown) {
    configInstance.error.catchError(error);
    return configInstance.error.returnApi();
  }
};

exports.postNews = async (req: any, res: any) => {
  const newsInstance = new NewsClass(req, res);
  const news: TNews = req.body;
  const { key } = req.params;

  if (key !== process.env.API_UPDATE_KEY) {
    newsInstance.error.setResult([ERROR_CODES.API_KEY_ERROR]);
    return newsInstance.error.returnApi();
  }

  // get all news and compare titles
  try {
    newsInstance.insert(news);
    return newsInstance.success.returnApi();
  } catch (error: unknown) {
    newsInstance.error.catchError(error);
    return newsInstance.error.returnApi();
  }
};

exports.news = async (req: any, res: any) => {
  const newsInstance = new NewsClass(req, res);
  newsInstance.success.setResult({});

  try {
    if (myCache.has('news')) {
      const news = myCache.get('news');
      newsInstance.success.setResult({ news: news });
    }

    newsInstance.getAll().then((news) => {
      newsInstance.success.setResult({ news: news });
      myCache.setNews(news);
      return newsInstance.success.returnApi();
    });
  } catch (error: unknown) {
    newsInstance.error.catchError(error);
    return newsInstance.error.returnApi();
  }
};
