import ErrorClass from '../classes/error';
import SuccessClass from '../classes/success';
import UserClass, { IUser } from '../classes/user';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';

const checkExistingValues = async (userInstance: UserClass) => {
  const allQueries = [
    userInstance.checkEmail(userInstance.email, userInstance.id || ''),
    userInstance.checkNickname(userInstance.nickname, userInstance.id || '')
  ];

  const allResults = await Promise.allSettled(allQueries);
  const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
    .filter((res) => res.status === 'rejected')
    .map((res) => res.reason);

  if (rejectedReasons.length > 0) {
    return new ErrorClass([
      { code: UNKNOWN_ERROR_CODE, message: rejectedReasons[0] }
    ]);
  }

  const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
    .filter((res) => res.status === 'fulfilled')
    .map((res) => res.value);

  let result = new ErrorClass();
  if (fulfilledValues[0].length > 0) {
    result.pushResult(ERROR_CODES.USER_EXISTING_EMAIL);
  }

  if (fulfilledValues[1].length > 0) {
    result.pushResult(ERROR_CODES.USER_EXISTING_NICKNAME);
  }

  return result;
};

exports.listAll = async function (req: any, res: any) {
  const userInstance = new UserClass({}, req, res);

  try {
    await userInstance.getAll().then((users: IUser[]) => {
      userInstance.success.setResult(users);
      return userInstance.success.returnApi();
    });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.listById = async function (req: any, res: any) {
  const userInstance = new UserClass({}, req, res);
  const { id } = req.params;

  try {
    await userInstance.getById(id).then((users: IUser[]) => {
      userInstance.success.setResult(users);
      return userInstance.success.returnApi();
    });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.register = async function register(req: any, res: any) {
  const userInstance = new UserClass(req.body, req, res);
  try {
    if (
      !userInstance.email ||
      !userInstance.password ||
      !userInstance.nickname
    ) {
      userInstance.error.pushResult(ERROR_CODES.MISSING_PARAMS);
      return userInstance.error.returnApi();
    }

    const checkResult: ErrorClass = await checkExistingValues(userInstance);

    if (checkResult.result.length > 0) {
      userInstance.error.setResult(checkResult.result);
      return userInstance.error.returnApi();
    }

    await userInstance
      .register(userInstance.email, userInstance.password)
      .then(async (result: any) => {
        userInstance.id = result.insertId;
        await userInstance
          .registerInfo(userInstance.id, userInstance.nickname)
          .then(async () => {
            await userInstance
              .login(userInstance.email, userInstance.password)
              .then((loginResult: IUser[]) => {
                if (loginResult.length > 0) {
                  const newUser = loginResult[0];
                  userInstance.replaceProperties(newUser);
                  req.session.user = newUser;
                  userInstance.success.setResult([newUser]);
                  return userInstance.success.returnApi();

                  // User.updateLastOnlineTime(newUser.id);
                } else {
                  userInstance.error.pushResult(ERROR_CODES.USER_UNKNOWN);
                  return userInstance.error.returnApi();
                }
              });
          });
      });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.login = async function (req: any, res: any) {
  const userInstance = new UserClass(req.body, req, res);

  if (req.session.user) {
    userInstance.error.setResult([ERROR_CODES.USER_EXISTING]);
    return userInstance.error.returnApi();
  }

  try {
    if (!userInstance.email || !userInstance.password) {
      userInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
      return userInstance.error.returnApi();
    }
    await userInstance
      .login(userInstance.email, userInstance.password)
      .then((loginResult: IUser[]) => {
        if (loginResult.length > 0) {
          const newUser = loginResult[0];
          userInstance.replaceProperties(newUser);
          req.session.user = newUser;
          userInstance.success.setResult({ loggedUser: newUser });
          return userInstance.success.returnApi();
        } else {
          userInstance.error.pushResult(ERROR_CODES.USER_WRONG_CREDENTIALS);
          return userInstance.error.returnApi();
        }
      });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.logout = function (req: any, res: any) {
  if (!req.session.user) {
    const errorInstance = new ErrorClass(
      [ERROR_CODES.USER_NOT_FOUND],
      req,
      res
    );
    return errorInstance.returnApi();
  }

  req.session.destroy();
  const successInstance = new SuccessClass([], req, res);
  return successInstance.returnApi();
};
