export type TError = {
  code: string;
  message: string;
};

const GENERAL = '00';
const USER_RELATED = '10';
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
    code: `${USER_RELATED}4`,
    message: 'Usuário não encontrado.'
  },
  USER_UNKNOWN: {
    code: `${USER_RELATED}9`,
    message: 'Erro desconhecido.'
  }
};

export const ERROR_CODES = {
  MISSING_PARAMS: {
    code: `${GENERAL}1`,
    message: 'Pedido inválido.'
  },
  GENERAL_UNKNOWN: {
    code: `${GENERAL}2`,
    message: 'Erro desconhecido.'
  },
  ...USER_ERRORS
};
