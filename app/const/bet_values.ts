export enum EXTRA_TYPES {
  CHAMPION,
  OFFENSE,
  DEFENSE,
  STRIKER
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
  GROUP: {
    ROUND: 1,
    MULTIPLIER: 1
  },
  ROUND_OF_16: {
    ROUND: 2,
    MULTIPLIER: 2
  },
  ROUND_OF_8: {
    ROUND: 3,
    MULTIPLIER: 3
  },
  SEMI_FINALS: {
    ROUND: 4,
    MULTIPLIER: 4
  },
  FINALS: {
    ROUND: 5,
    MULTIPLIER: 5
  }
};
