export type TError = {
  code: string;
  message: string;
};

const GENERAL = '00';
const USER_RELATED = '10';
const BETS_RELATED = '20';
export const UNKNOWN_ERROR_CODE = 'XXX';

const USER_ERRORS = {
  USER_WRONG_CREDENTIALS: {
    code: `${USER_RELATED}1`,
    message: 'Login e/ou senha inválidos. Tente novamente.'
  },
  USER_EXISTING_EMAIL: {
    code: `${USER_RELATED}2`,
    message: 'Email já está sendo usado.'
  },
  USER_EXISTING_NICKNAME: {
    code: `${USER_RELATED}3`,
    message: 'Apelido já está sendo usado.'
  },
  USER_EXISTING: {
    code: `${USER_RELATED}4`,
    message: 'Usuário já logado.'
  },
  USER_NOT_FOUND: {
    code: `${USER_RELATED}5`,
    message: 'Usuário não encontrado.'
  },
  USER_WRONG_PASSWORD: {
    code: `${USER_RELATED}6`,
    message: 'Senha inválida. Tente novamente.'
  },
  USER_INVALID_TOKEN: {
    code: `${USER_RELATED}6`,
    message: 'Token inválido.'
  },
  USER_INACTIVE: {
    code: `${USER_RELATED}7`,
    message: 'Usuário inativo.'
  },
  USER_UNKNOWN: {
    code: `${USER_RELATED}9`,
    message: 'Erro desconhecido.'
  }
};

const BET_ERRORS = {
  BAD_PARAMS: {
    code: `${BETS_RELATED}1`,
    message: 'Pedido inválido (mismatched params).'
  },
  NOT_ALLOWED: {
    code: `${BETS_RELATED}2`,
    message: 'Pedido não permitido.'
  },
  BET_UNKNOWN: {
    code: `${BETS_RELATED}9`,
    message: 'Erro desconhecido.'
  }
};

export const ERROR_CODES = {
  MISSING_PARAMS: {
    code: `${GENERAL}1`,
    message: 'Pedido inválido (missing params).'
  },
  CACHE_ERROR: {
    code: `${GENERAL}2`,
    message: 'Erro na cache.'
  },
  API_KEY_ERROR: {
    code: `${GENERAL}3`,
    message: 'Erro na API key.'
  },
  GENERAL_UNKNOWN: {
    code: `${GENERAL}9`,
    message: 'Erro desconhecido.'
  },
  ...USER_ERRORS,
  ...BET_ERRORS
};
