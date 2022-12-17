import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import NewsClass, { TNews } from '../classes/news';
import PlayerClass, { IPlayer, IPlayerRaw } from '../classes/player';
import RefereeClass, { IReferee, IRefereeRaw } from '../classes/referee';
import TeamClass, { ITeam, ITeamRaw } from '../classes/team';

const NodeCache = require('node-cache');
const CacheInstance = new NodeCache({ checkperiod: 10 });

class CacheClass {
  has(item: string) {
    return CacheInstance.has(item);
  }

  get(item: string) {
    return CacheInstance.get(item);
  }

  setSeasonStart(seasonStart: number) {
    CacheInstance.set('seasonStart', seasonStart, 60 * 60 * 24); // Daily
  }

  setTeams(teams: ITeam[]) {
    CacheInstance.set('teams', teams, 60 * 60 * 24); // Daily
  }

  setMatches(matches: IMatch[]) {
    CacheInstance.set('matches', matches, 10); // Every 10s
  }

  setNews(news: TNews[]) {
    CacheInstance.set('news', news, 60 * 15); // Every 15min
  }

  setReferees(referees: IReferee[]) {
    CacheInstance.set('referees', referees, 60 * 60 * 24); // Daily
  }

  setPlayers(players: IPlayer[]) {
    CacheInstance.set('players', players, 60 * 60 * 24); // Daily
  }

  async refreshAll() {
    if (!this.has('news')) {
      console.log('Cache miss: news');
      const newsInstance = new NewsClass();

      await newsInstance.getAll().then((news) => {
        this.setNews(news);
      });
    }

    if (!this.has('referees')) {
      console.log('Cache miss: referees');
      const refereeInstance = new RefereeClass();

      await refereeInstance.getAll().then((rawReferees: IRefereeRaw[]) => {
        const formattedReferees = rawReferees.map((referee) =>
          refereeInstance.formatRawReferee(referee)
        );
        this.setReferees(formattedReferees);
      });
    }

    if (!this.has('players')) {
      console.log('Cache miss: players');
      const playerInstance = new PlayerClass();

      await playerInstance.getAll().then((rawPlayers: IPlayerRaw[]) => {
        const formattedPlayers = rawPlayers.map((player) =>
          playerInstance.formatRawPlayer(player)
        );
        this.setPlayers(formattedPlayers);
      });
    }

    if (!this.has('teams')) {
      console.log('Cache miss: teams');
      const teamInstance = new TeamClass();
      await teamInstance.getAll().then((rawTeams: ITeamRaw[]) => {
        const formattedTeams = rawTeams.map((team) =>
          teamInstance.formatRawTeam(team)
        );
        this.setTeams(formattedTeams);
      });
    }

    if (!this.has('matches')) {
      console.log('Cache miss: matches');
      const matchInstance = new MatchClass();
      await matchInstance.getAll().then((rawMatches: IMatchRaw[]) => {
        const formattedMatches: IMatch[] = rawMatches.map((match) =>
          matchInstance.formatRawMatch(match)
        );
        this.setMatches(formattedMatches);

        if (!this.has('seasonStart')) {
          console.log('Cache miss: season start');

          const seasonStart = formattedMatches.reduce(
            (prev: IMatch, curr: IMatch) =>
              prev.timestamp <= curr.timestamp ? prev : curr
          );

          const seasonStartTimestamp =
            new Date(seasonStart.timestamp).getTime() / 1000;
          this.setSeasonStart(seasonStartTimestamp);
        }

      });
    }

    return;
  }
}

export const myCache = new CacheClass();
