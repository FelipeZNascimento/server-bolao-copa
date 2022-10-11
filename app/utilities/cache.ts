import { IMatch } from '../classes/match';
import { TNews } from '../classes/scraper';
import { ITeam } from '../classes/team';

const NodeCache = require('node-cache');

const CacheInstance = new NodeCache({ checkperiod: 10 });

class CacheClass {
  has(item: string) {
    return CacheInstance.has(item);
  }

  get(item: string) {
    return CacheInstance.get(item);
  }

  setTeams(teams: ITeam[]) {
    CacheInstance.set('teams', teams, 60 * 60 * 24); // Daily
  }

  setMatches(matches: IMatch[]) {
    CacheInstance.set('matches', matches, 10); // Every 10s
  }

  setSeasonStart(seasonStart: number) {
    CacheInstance.set('seasonStart', seasonStart, 60 * 60 * 24); // Daily
  }

  setNews(news: TNews[]) {
    CacheInstance.set('news', news);
  }
}

export const myCache = new CacheClass();
