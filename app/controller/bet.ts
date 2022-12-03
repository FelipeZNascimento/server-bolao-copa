import { myCache } from '../utilities/cache';

import BetClass from '../classes/bet';
import ExtraBetClass, { IExtraBetRaw, IExtraBetResults } from '../classes/extraBet';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import UserClass from '../classes/user';
import { EXTRA_TYPES } from '../const/bet_values';

exports.update = async (req: any, res: any) => {
  const betInstance = new BetClass(req.body, req, res);
  const userInstance = new UserClass(req.session.user, req, res);

  if (
    !req.session.user ||
    betInstance.idUser === null ||
    betInstance.idUser !== req.session.user.id
  ) {
    betInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return betInstance.error.returnApi();
  }

  if (!userInstance.isActive) {
    betInstance.error.setResult([ERROR_CODES.USER_INACTIVE]);
    return betInstance.error.returnApi();
  }

  if (betInstance.idUser === null || betInstance.idMatch === null) {
    betInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return betInstance.error.returnApi(401);
  }

  if (
    betInstance.goalsAway !== null &&
    betInstance.goalsHome !== null &&
    (betInstance.goalsAway < 0 || betInstance.goalsHome < 0)
  ) {
    betInstance.error.setResult([ERROR_CODES.BAD_PARAMS]);
    return betInstance.error.returnApi(401);
  }

  userInstance.updateTimestamp(betInstance.idUser);

  try {
    await betInstance
      .update(
        betInstance.idMatch,
        betInstance.idUser,
        betInstance.goalsAway,
        betInstance.goalsHome
      )
      .then((queryInfo) => {
        if (queryInfo.affectedRows > 0) {
          return betInstance.success.returnApi();
        } else {
          betInstance.error.setResult([ERROR_CODES.NOT_ALLOWED]);
          return betInstance.error.returnApi();
        }
      });
  } catch (error: unknown) {
    betInstance.error.catchError(error);
    return betInstance.error.returnApi();
  }
};

exports.listAllExtras = async (req: any, res: any) => {
  const extraBetInstance = new ExtraBetClass(req, res);
  const userInstance = new UserClass({}, req, res);
  const loggedUser = req.session.user;
  const seasonStartTimestamp = myCache.get('seasonStart');
  const teams = myCache.get('teams');

  if (loggedUser) {
    userInstance.updateTimestamp(loggedUser.id);
  }

  try {
    const allQueries = [
      extraBetInstance
        .getAll(seasonStartTimestamp)
        .then((res) => ({ res: res, promiseContent: 'extraBets' })),
      extraBetInstance
        .getFromLoggedUser(loggedUser ? loggedUser.id : null)
        .then((res) => ({ res: res, promiseContent: 'loggedUserExtraBets' })),
      extraBetInstance
        .getResults(seasonStartTimestamp)
        .then((res) => ({ res: res, promiseContent: 'extraBetsResults' }))

    ];

    const allResults = await Promise.allSettled(allQueries);
    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      extraBetInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return extraBetInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    const extraBetsRaw: IExtraBetRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'extraBets'
    ).res;

    const loggedUserExtraBetsRaw: IExtraBetRaw[] = fulfilledValues.find(
      (item) => item.promiseContent === 'loggedUserExtraBets'
    ).res;

    const allExtraBetsResults: IExtraBetResults[] = fulfilledValues.find(
      (item) => item.promiseContent === 'extraBetsResults'
    ).res;

    const formattedExtraBets = extraBetsRaw.map((bet) =>
      extraBetInstance.formatRawExtraBet(bet, teams)
    );

    const formattedLoggedUserExtraBets = loggedUserExtraBetsRaw.map((bet) =>
      extraBetInstance.formatRawExtraBet(bet, teams)
    );

    extraBetInstance.setExtraBets(formattedExtraBets);
    extraBetInstance.setExtraBetsResults(allExtraBetsResults);
    extraBetInstance.setLoggedUserExtraBets(formattedLoggedUserExtraBets);

    const buildObject = extraBetInstance.buildConfigObject();
    extraBetInstance.success.setResult(buildObject);
    return extraBetInstance.success.returnApi();
  } catch (error: unknown) {
    extraBetInstance.error.catchError(error);
    return extraBetInstance.error.returnApi();
  }
};

exports.updateExtra = async (req: any, res: any) => {
  const extraBetInstance = new ExtraBetClass(req, res);
  const userInstance = new UserClass({}, req, res);
  extraBetInstance.setNewExtraBet(req.body);
  const loggedUser = req.session.user;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (
    !loggedUser ||
    extraBetInstance.newExtraBet === null ||
    extraBetInstance.newExtraBet.idUser === null ||
    extraBetInstance.newExtraBet.idUser !== loggedUser.id
  ) {
    extraBetInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return extraBetInstance.error.returnApi(401);
  }

  if (!loggedUser.isActive) {
    extraBetInstance.error.setResult([ERROR_CODES.USER_INACTIVE]);
    return extraBetInstance.error.returnApi();
  }

  if (
    extraBetInstance.newExtraBet.idExtraType === null ||
    (extraBetInstance.newExtraBet.idPlayer === null &&
      extraBetInstance.newExtraBet.idTeam === null)
  ) {
    extraBetInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return extraBetInstance.error.returnApi();
  }

  if (!myCache.has('seasonStart')) {
    extraBetInstance.error.setResult([ERROR_CODES.CACHE_ERROR]);
    return extraBetInstance.error.returnApi();
  }
  const seasonStart = myCache.get('seasonStart');

  if (currentTimestamp > seasonStart) {
    extraBetInstance.error.setResult([ERROR_CODES.NOT_ALLOWED]);
    return extraBetInstance.error.returnApi();
  }

  userInstance.updateTimestamp(loggedUser.id);
  try {
    await extraBetInstance
      .update(
        extraBetInstance.newExtraBet.idUser,
        extraBetInstance.newExtraBet.idExtraType,
        extraBetInstance.newExtraBet.idTeam,
        extraBetInstance.newExtraBet.idPlayer,
        seasonStart
      )
      .then((queryInfo) => {
        if (queryInfo.affectedRows > 0) {
          return extraBetInstance.success.returnApi();
        } else {
          extraBetInstance.error.setResult([ERROR_CODES.BAD_PARAMS]);
          return extraBetInstance.error.returnApi();
        }
      });
  } catch (error: unknown) {
    extraBetInstance.error.catchError(error);
    return extraBetInstance.error.returnApi();
  }
};
