import { BET_MULTIPLIER } from '../const/bet_values';

export const matchValue = (round: number) => {
  switch (round) {
    case BET_MULTIPLIER.GROUP_1.ROUND: {
      return BET_MULTIPLIER.GROUP_1.MULTIPLIER;
    }
    case BET_MULTIPLIER.GROUP_2.ROUND: {
      return BET_MULTIPLIER.GROUP_2.MULTIPLIER;
    }
    case BET_MULTIPLIER.GROUP_3.ROUND: {
      return BET_MULTIPLIER.GROUP_3.MULTIPLIER;
    }
    case BET_MULTIPLIER.ROUND_OF_16.ROUND: {
      return BET_MULTIPLIER.ROUND_OF_16.MULTIPLIER;
    }
    case BET_MULTIPLIER.ROUND_OF_8.ROUND: {
      return BET_MULTIPLIER.ROUND_OF_8.MULTIPLIER;
    }
    case BET_MULTIPLIER.SEMI_FINALS.ROUND: {
      return BET_MULTIPLIER.SEMI_FINALS.MULTIPLIER;
    }
    case BET_MULTIPLIER.FINALS.ROUND: {
      return BET_MULTIPLIER.FINALS.MULTIPLIER;
    }

    default: {
      return 0;
    }
  }
};
