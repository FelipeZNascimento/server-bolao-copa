export enum EXTRA_TYPES {
  CHAMPION,
  STRIKER,
  OFFENSE,
  DEFENSE
}

export const BET_POINTS = {
  FULL: 5,
  PARTIAL: 3,
  MINIMUN: 2,
  MISS: 0
};

export const EXTRA_BET_POINTS = {
  CHAMPION: 40,
  STRIKER: 10,
  OFFENSE: 10,
  DEFENSE: 10
};

export const BET_MULTIPLIER = {
  GROUP_1: {
    ROUND: 1,
    MULTIPLIER: 1
  },
  GROUP_2: {
    ROUND: 2,
    MULTIPLIER: 1
  },
  GROUP_3: {
    ROUND: 3,
    MULTIPLIER: 1
  },
  ROUND_OF_16: {
    ROUND: 4,
    MULTIPLIER: 2
  },
  ROUND_OF_8: {
    ROUND: 5,
    MULTIPLIER: 3
  },
  SEMI_FINALS: {
    ROUND: 6,
    MULTIPLIER: 4
  },
  FINALS: {
    ROUND: 7,
    MULTIPLIER: 5
  }
};
