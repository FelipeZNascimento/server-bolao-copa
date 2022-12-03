// Classes
import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';

// Types
import { IExtraBet, IExtraBetResults } from './extraBet';
import { IUser } from './user';
import { IBet } from './bet';
import { IMatch } from './match';

// Utilities
import { matchValue } from '../utilities/bet_calculator';

// Constants
import { BET_POINTS, EXTRA_BET_POINTS, EXTRA_TYPES } from '../const/bet_values';

export interface IUserRanking extends IUser {
  position: number;
  points: number;
  full: number;
  half: number;
  minimun: number;
  extras: number;
}

export interface IRanking {
  round: number;
  rankingUsers: IUserRanking[];
}

class RankingClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;
  ranking: IRanking;

  constructor(req?: any, res?: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.ranking = {
      round: 0,
      rankingUsers: []
    };
  }

  prepareUsers(users: IUser[]) {
    const rankingUsers = users.map((user) => {
      return {
        ...user,
        position: 1,
        points: 0,
        full: 0,
        half: 0,
        minimun: 0,
        extras: 0
      };
    });

    this.ranking = {
      ...this.ranking,
      rankingUsers: rankingUsers
    };
  }

  calculate(match: IMatch, bet: IBet) {
    const calculationObject = {
      points: 0,
      full: 0,
      half: 0,
      minimun: 0
    };

    const matchMultiplier = matchValue(match.round);

    if (
      match.awayTeam.goals !== null &&
      match.homeTeam.goals !== null &&
      bet.goalsAway !== null &&
      bet.goalsHome !== null
    ) {
      // valid goals
      if (
        (bet.goalsAway > bet.goalsHome &&
          match.awayTeam.goals > match.homeTeam.goals) ||
        (bet.goalsAway < bet.goalsHome &&
          match.awayTeam.goals < match.homeTeam.goals)
      ) {
        // Acertou o vencedor
        if (
          bet.goalsAway === match.awayTeam.goals &&
          bet.goalsHome === match.homeTeam.goals
        ) {
          // na mosca
          calculationObject.points = BET_POINTS.FULL * matchMultiplier;
          calculationObject.full++;
        } else {
          if (
            bet.goalsAway === match.awayTeam.goals ||
            bet.goalsHome === match.homeTeam.goals
          ) {
            // acertou 1 placar
            calculationObject.points = BET_POINTS.PARTIAL * matchMultiplier;
            calculationObject.half++;
          } else {
            // não acertou placar
            calculationObject.points = BET_POINTS.MINIMUN * matchMultiplier;
            calculationObject.minimun++;
          }
        }
      } else if (
        bet.goalsAway === bet.goalsHome &&
        match.awayTeam.goals === match.homeTeam.goals
      ) {
        // Acertou empate
        if (bet.goalsAway === match.awayTeam.goals) {
          // na mosca
          calculationObject.points = BET_POINTS.FULL * matchMultiplier;
          calculationObject.full++;
        } else {
          // não acertou placar
          calculationObject.points = BET_POINTS.MINIMUN * matchMultiplier;
          calculationObject.minimun++;
        }
      }
    }

    return calculationObject;
  }

  buildRanking(
    allMatches: IMatch[],
    allExtraBets: IExtraBet[],
    allExtraBetsResults: IExtraBetResults[]
  ) {
    const strikers = allExtraBetsResults.filter((extraBet) => extraBet.id_type === EXTRA_TYPES.STRIKER && extraBet.id_striker !== null);
    const offenses = allExtraBetsResults.filter((extraBet) => extraBet.id_type === EXTRA_TYPES.OFFENSE && extraBet.id_team !== null);
    const defenses = allExtraBetsResults.filter((extraBet) => extraBet.id_type === EXTRA_TYPES.DEFENSE && extraBet.id_team !== null);
    const champions = allExtraBetsResults.filter((extraBet) => extraBet.id_type === EXTRA_TYPES.CHAMPION && extraBet.id_team !== null);

    this.ranking.rankingUsers.forEach((user) => {
      const userExtraBets = allExtraBets.filter(
        (item) => item.user.id === user.id
      );
      if (allExtraBetsResults.length > 0 && userExtraBets.length > 0) {
        userExtraBets.forEach((userExtraBet) => {
          if (userExtraBet.team) {
            if (
              userExtraBet.idExtraType === EXTRA_TYPES.CHAMPION &&
              champions.find((item) => item.id_team === userExtraBet.team?.id)
            ) {
              user.extras += EXTRA_BET_POINTS.CHAMPION;
            } else if (
              userExtraBet.idExtraType === EXTRA_TYPES.OFFENSE &&
              offenses.find((item) => item.id_team === userExtraBet.team?.id)
            ) {
              user.extras += EXTRA_BET_POINTS.OFFENSE;
            } else if (
              userExtraBet.idExtraType === EXTRA_TYPES.DEFENSE &&
              defenses.find((item) => item.id_team === userExtraBet.team?.id)
            ) {
              user.extras += EXTRA_BET_POINTS.DEFENSE;
            }
          } else if (
            userExtraBet.idExtraType === EXTRA_TYPES.STRIKER &&
            strikers.find((item) => item.id_striker === userExtraBet.player?.id)
          ) {
            user.extras += EXTRA_BET_POINTS.STRIKER;
          }
        });

        user.points += user.extras;
      }

      allMatches.forEach((match) => {
        const userBet = match.bets.find((bet) => bet.user.id === user.id);
        if (userBet) {
          const calculated = this.calculate(match, userBet);
          user.points += calculated.points;
          user.full += calculated.full;
          user.half += calculated.half;
          user.minimun += calculated.minimun;
        }
      });
    });

    this.ranking.rankingUsers.sort(
      (a, b) =>
        b.points - a.points ||
        b.full - a.full ||
        b.half - a.half ||
        b.minimun - a.minimun ||
        a.nickname.localeCompare(b.nickname)
    );

    let currentPosition: number;
    let lastCheckedUser: IUserRanking | null = null;
    this.ranking.rankingUsers.forEach((item) => {
      if (lastCheckedUser === null) {
        currentPosition = 1;
      } else {
        currentPosition++;
        if (
          item.points < lastCheckedUser.points ||
          item.full < lastCheckedUser.full ||
          item.half < lastCheckedUser.half ||
          item.minimun < lastCheckedUser.minimun
        ) {
          item.position = currentPosition;
        } else {
          item.position = lastCheckedUser.position;
        }
      }

      lastCheckedUser = item;
    });
  }
}

export default RankingClass;
