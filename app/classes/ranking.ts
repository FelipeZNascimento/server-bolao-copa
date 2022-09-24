import SuccessClass from './success';
import ErrorClass from './error';
import QueryMaker from './queryMaker';
import { IUser } from './user';
import { IBet } from './bet';
import { IMatch } from './match';

export interface IUserRanking extends IUser {
  points: number;
  full: number;
  half: number;
  minimun: number;
}

export interface IRanking {
  round: number;
  users: IUserRanking[];
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
      users: []
    };
  }

  //   setRanking(ranking: []) {
  //     this.ranking = ranking;
  //   }
  prepareUsers(users: IUser[]) {
    const rankingUsers = users.map((user) => {
      return {
        ...user,
        points: 0,
        full: 0,
        half: 0,
        minimun: 0
      };
    });

    this.ranking = {
      ...this.ranking,
      users: rankingUsers
    };
  }

  calculate(match: IMatch, bet: IBet) {
    const calculationObject = {
      points: 0,
      full: 0,
      half: 0,
      minimun: 0
    };
    console.log(`match: ${match.homeTeam.goals} x ${match.awayTeam.goals} `);
    console.log(`bet: ${bet.goalsHome} x ${bet.goalsAway}`);

    if (
      match.awayTeam.goals !== null &&
      match.homeTeam.goals !== null &&
      bet.goalsAway !== null &&
      bet.goalsHome !== null
    ) {
      console.log('valid goals');
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
          calculationObject.points = 5;
          calculationObject.full++;
        } else {
          if (
            bet.goalsAway === match.awayTeam.goals ||
            bet.goalsHome === match.homeTeam.goals
          ) {
            // acertou 1 placar
            calculationObject.points = 3;
            calculationObject.half++;
          } else {
            // não acertou placar
            calculationObject.points = 2;
            calculationObject.minimun++;
          }
        }
      } else if (
        bet.goalsAway === bet.goalsHome &&
        match.awayTeam.goals === match.homeTeam.goals
      ) {
        console.log('draw');
        // Acertou empate
        if (bet.goalsAway === match.awayTeam.goals) {
          console.log('draw na mosca');
          // na mosca
          calculationObject.points = 5;
          calculationObject.full++;
        } else {
          console.log('draw nope');
          // não acertou placar
          calculationObject.points = 2;
          calculationObject.minimun++;
        }
      }
    }

    return calculationObject;
  }

  buildRanking(allMatches: IMatch[]) {
    // console.log(this.ranking.users);
    // console.log(allMatches[0].bets);
    // console.log(
    //   allMatches[0].bets.find((bet) => bet.user.id === this.ranking.users[0].id)
    // );
    this.ranking.users.forEach((user) => {
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
  }
}

export default RankingClass;
