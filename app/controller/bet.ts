import { myCache } from '../utilities/cache';

import BetClass from '../classes/bet';
import ExtraBetClass, { IExtraBetRaw } from '../classes/extraBet';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import UserClass from '../classes/user';

exports.update = async (req: any, res: any) => {
  const betInstance = new BetClass(req.body, req, res);
  const userInstance = new UserClass({}, req, res);

  if (
    !req.session.user ||
    betInstance.idUser === null ||
    betInstance.idUser !== req.session.user.id
  ) {
    betInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
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
  userInstance.updateTimestamp(loggedUser.id);
  try {
    const allQueries = [
      extraBetInstance
        .getAll(seasonStartTimestamp)
        .then((res) => ({ res: res, promiseContent: 'extraBets' })),
      extraBetInstance
        .getFromLoggedUser(loggedUser ? loggedUser.id : null)
        .then((res) => ({ res: res, promiseContent: 'loggedUserExtraBets' }))
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

    const formattedExtraBets = extraBetsRaw.map((bet) =>
      extraBetInstance.formatRawExtraBet(bet, teams)
    );

    const formattedLoggedUserExtraBets = loggedUserExtraBetsRaw.map((bet) =>
      extraBetInstance.formatRawExtraBet(bet, teams)
    );

    extraBetInstance.setExtraBets(formattedExtraBets);
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
  const betInstance = new ExtraBetClass(req, res);
  const userInstance = new UserClass({}, req, res);
  betInstance.setNewExtraBet(req.body);
  const loggedUser = req.session.user;

  if (
    !loggedUser ||
    betInstance.newExtraBet === null ||
    betInstance.newExtraBet.idUser === null ||
    betInstance.newExtraBet.idUser !== loggedUser.id
  ) {
    betInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return betInstance.error.returnApi(401);
  }

  if (
    betInstance.newExtraBet.idExtraType === null ||
    (betInstance.newExtraBet.idPlayer === null &&
      betInstance.newExtraBet.idTeam === null)
  ) {
    betInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return betInstance.error.returnApi();
  }

  if (!myCache.has('seasonStart')) {
    betInstance.error.setResult([ERROR_CODES.CACHE_ERROR]);
    return betInstance.error.returnApi();
  }

  const seasonStart = myCache.get('seasonStart');
  userInstance.updateTimestamp(loggedUser.id);

  try {
    await betInstance
      .update(
        betInstance.newExtraBet.idUser,
        betInstance.newExtraBet.idExtraType,
        betInstance.newExtraBet.idTeam,
        betInstance.newExtraBet.idPlayer,
        seasonStart
      )
      .then((queryInfo) => {
        if (queryInfo.affectedRows > 0) {
          return betInstance.success.returnApi();
        } else {
          betInstance.error.setResult([ERROR_CODES.BAD_PARAMS]);
          return betInstance.error.returnApi();
        }
      });
  } catch (error: unknown) {
    betInstance.error.catchError(error);
    return betInstance.error.returnApi();
  }
};
