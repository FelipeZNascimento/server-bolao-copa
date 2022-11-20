import ErrorClass from '../classes/error';
import PlayerClass, { IPlayerRaw } from '../classes/player';
import SuccessClass from '../classes/success';
import { myCache } from '../utilities/cache';

exports.refresh = async function (req: any, res: any) {

  try {
    await myCache.refreshAll().then(() => {
      const successInstance = new SuccessClass([], req, res);
      return successInstance.returnApi();
    });
  } catch (error) {
    const errorInstance = new ErrorClass(req, res);
    errorInstance.catchError(error);
    return errorInstance.returnApi();
  }
};
