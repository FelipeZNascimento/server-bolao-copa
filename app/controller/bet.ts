import BetClass from '../classes/bet';
import ExtraBetClass, { IExtraBetRaw } from '../classes/extraBet';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
const myCache = require('../utilities/cache');

exports.update = async (req: any, res: any) => {
  const betInstance = new BetClass(req.body, req, res);

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
    return betInstance.error.returnApi();
  }

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
          betInstance.error.setResult([ERROR_CODES.BAD_PARAMS]);
          return betInstance.error.returnApi();
        }
      });
  } catch (error: unknown) {
    betInstance.error.catchError(error);
    return betInstance.error.returnApi();
  }
};

exports.listAllExtras = async (req: any, res: any) => {
  const betInstance = new ExtraBetClass(req.body, req, res);
  const loggedUser = req.session.user;
  const seasonStartTimestamp = myCache.get('seasonStart');
  const teams = myCache.get('teams');

  try {
    const allQueries = [
      betInstance.getAll(seasonStartTimestamp),
      betInstance.getFromLoggedUser(loggedUser ? loggedUser.id : null)
    ];

    const allResults = await Promise.allSettled(allQueries);
    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      betInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return betInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    betInstance.pushBets(fulfilledValues[0], teams, false); // All available bets
    betInstance.pushBets(fulfilledValues[1], teams, true); // All loggedUserBets
    const buildObject = betInstance.buildConfigObject();
    betInstance.success.setResult(buildObject);
    return betInstance.success.returnApi();
  } catch (error: unknown) {
    betInstance.error.catchError(error);
    return betInstance.error.returnApi();
  }
};

exports.updateExtra = async (req: any, res: any) => {
  const betInstance = new ExtraBetClass(req.body, req, res);

  if (
    !req.session.user ||
    betInstance.idUser === null ||
    betInstance.idUser !== req.session.user.id
  ) {
    betInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return betInstance.error.returnApi();
  }

  if (
    betInstance.idExtraType === null ||
    (betInstance.idPlayer === null && betInstance.idTeam === null)
  ) {
    betInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return betInstance.error.returnApi();
  }

  try {
    await betInstance
      .update(
        betInstance.idUser,
        betInstance.idExtraType,
        betInstance.idTeam,
        betInstance.idPlayer,
        req.session.seasonStart
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
