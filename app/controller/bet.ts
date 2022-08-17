import BetClass from '../classes/bet';
import { ERROR_CODES } from '../const/error_codes';

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
