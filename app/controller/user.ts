import ErrorClass from '../classes/error';
import MailerClass from '../classes/mailer';
import SuccessClass from '../classes/success';
import UserClass, { IUser, IUserOld, IUserRaw } from '../classes/user';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';
import { guidGenerator } from '../utilities/guidGenerator';

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
    return new ErrorClass({
      errors: [{ code: UNKNOWN_ERROR_CODE, message: rejectedReasons[0] }]
    });
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
    await userInstance.getAll().then((users: IUserRaw[]) => {
      const formattedUsers = users.map((user) =>
        userInstance.formatRawUser(user)
      );
      userInstance.success.setResult({ users: formattedUsers });
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

exports.register = async function (req: any, res: any) {
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

    if (checkResult.result.errors.length > 0) {
      userInstance.error.setResult(checkResult.result.errors);
      return userInstance.error.returnApi();
    }

    await userInstance
      .register(userInstance.email, userInstance.password)
      .then(async (result: any) => {
        userInstance.id = result.insertId;
        await userInstance
          .registerInfo(userInstance.id, userInstance.nickname)
          .then(async () => {
            const mailerInstance = new MailerClass();
            mailerInstance.sendWelcome(
              userInstance.nickname,
              userInstance.email
            );

            await userInstance
              .login(userInstance.email, userInstance.password)
              .then((loginResultRaw: IUserRaw[]) => {
                if (loginResultRaw.length > 0) {
                  const newUser = userInstance.formatRawUser(loginResultRaw[0]);
                  req.session.user = newUser;
                  userInstance.success.setResult({ loggedUser: newUser });
                  userInstance.updateTimestamp(newUser.id);
                  return userInstance.success.returnApi();
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
    return userInstance.error.returnApi(403);
  }

  try {
    if (!userInstance.email || !userInstance.password) {
      userInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
      return userInstance.error.returnApi();
    }

    await userInstance
      .login(userInstance.email, userInstance.password)
      .then((loginResultRaw: IUserRaw[]) => {
        if (loginResultRaw.length > 0) {
          const newUser = userInstance.formatRawUser(loginResultRaw[0]);
          req.session.user = newUser;
          userInstance.success.setResult({ loggedUser: newUser });
          userInstance.updateTimestamp(newUser.id);
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
      { errors: [ERROR_CODES.USER_NOT_FOUND] },
      req,
      res
    );
    return errorInstance.returnApi();
  }

  req.session.destroy(function () {
    if (req.session && req.session.user) {
      delete req.session.user;
    }
  });

  const successInstance = new SuccessClass([], req, res);
  return successInstance.returnApi();
};

exports.updateInfo = async function (req: any, res: any) {
  const userInstance = new UserClass(req.body, req, res);
  if (!req.session.user) {
    userInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return userInstance.error.returnApi(401);
  }

  if (!userInstance.id || !userInstance.nickname || !userInstance.name) {
    userInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return userInstance.error.returnApi();
  }
  try {
    const checkResult: ErrorClass = await checkExistingValues(userInstance);

    if (checkResult.result.errors.length > 0) {
      userInstance.error.setResult(checkResult.result.errors);
      return userInstance.error.returnApi(403);
    }

    await userInstance
      .updateInfo(userInstance.id, userInstance.name, userInstance.nickname)
      .then(() => {
        req.session.user = {
          id: userInstance.id,
          name: userInstance.name,
          email: userInstance.email || req.session.user.email,
          nickname: userInstance.nickname
        };

        userInstance.success.setResult({
          loggedUser: {
            id: userInstance.id,
            name: userInstance.name,
            email: userInstance.email || req.session.user.email,
            nickname: userInstance.nickname,
            isActive: true
          }
        });

        return userInstance.success.returnApi();
      });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.updatePassword = async function (req: any, res: any) {
  const userInstance = new UserClass(req.body, req, res);
  const loggedUser = req.session.user;
  if (!loggedUser) {
    userInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return userInstance.error.returnApi(401);
  }

  if (!userInstance.id || !userInstance.password || !userInstance.newPassword) {
    userInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return userInstance.error.returnApi();
  }

  userInstance.updateTimestamp(loggedUser.id);
  try {
    const checkResult: ErrorClass = await checkExistingValues(userInstance);

    if (checkResult.result.errors.length > 0) {
      userInstance.error.setResult(checkResult.result.errors);
      return userInstance.error.returnApi(403);
    }

    await userInstance
      .updatePassword(
        userInstance.id,
        userInstance.password,
        userInstance.newPassword
      )
      .then((queryInfo) => {
        if (queryInfo.affectedRows > 0) {
          const mailerInstance = new MailerClass();

          userInstance.success.setResult({
            loggedUser: {
              id: req.session.user.id,
              name: req.session.user.name,
              email: req.session.user.email,
              nickname: req.session.user.nickname,
              isActive: true
            }
          });

          mailerInstance.sendPasswordConfirmation(
            loggedUser.nickname,
            loggedUser.email
          );

          return userInstance.success.returnApi();
        } else {
          userInstance.error.setResult([ERROR_CODES.USER_WRONG_PASSWORD]);
          return userInstance.error.returnApi(403);
        }
      });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.resetPassword = async function (req: any, res: any) {
  const mailerInstance = new MailerClass();
  const userInstance = new UserClass({}, req, res);
  const { email } = req.query;

  if (!email) {
    userInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return userInstance.error.returnApi();
  }

  try {
    userInstance.checkEmail(email, '').then((result) => {
      if (result.length > 0) {
        const guid = guidGenerator();
        const formattedUser = userInstance.formatRawUser(result[0]);
        userInstance.set(formattedUser);

        userInstance.setPasswordRecovery(userInstance.id, guid);
        mailerInstance.sendPasswordRecovery(
          userInstance.nickname,
          guid,
          userInstance.email
        );
      }
    });

    return userInstance.success.returnApi();
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.recoverPassword = async function (req: any, res: any) {
  const userInstance = new UserClass(req.body, req, res);

  if (!userInstance.newPassword || !userInstance.token || !userInstance.email) {
    userInstance.error.setResult([ERROR_CODES.MISSING_PARAMS]);
    return userInstance.error.returnApi();
  }

  try {
    const checkEmailResultRaw: IUserRaw[] = await userInstance.checkEmail(
      userInstance.email,
      ''
    );
    const checkTokenResultRaw: IUserRaw[] = await userInstance.checkToken(
      userInstance.email,
      userInstance.token
    );

    if (checkEmailResultRaw.length === 0) {
      userInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
      return userInstance.error.returnApi(403);
    }

    if (checkTokenResultRaw.length === 0) {
      userInstance.error.setResult([ERROR_CODES.USER_INVALID_TOKEN]);
      return userInstance.error.returnApi(403);
    }

    const checkEmailResult = userInstance.formatRawUser(checkEmailResultRaw[0]);
    const checkTokenResult = userInstance.formatRawUser(checkTokenResultRaw[0]);

    if (checkEmailResult.id !== checkTokenResult.id) {
      userInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
      return userInstance.error.returnApi(403);
    }

    userInstance.set({
      ...checkEmailResult,
      token: userInstance.token,
      newPassword: userInstance.newPassword
    });

    userInstance
      .updatePasswordViaToken(
        userInstance.id,
        userInstance.newPassword,
        userInstance.token
      )
      .then((result) => {
        const mailerInstance = new MailerClass();
        if (result.affectedRows > 0) {
          userInstance.consumeToken(userInstance.token);
          mailerInstance.sendPasswordConfirmation(
            userInstance.nickname,
            userInstance.email
          );
        }
        return userInstance.success.returnApi();
      });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};

exports.updateIsActive = async function (req: any, res: any) {
  const userInstance = new UserClass(req.body, req, res);
  if (!req.session.user) {
    userInstance.error.setResult([ERROR_CODES.USER_NOT_FOUND]);
    return userInstance.error.returnApi(401);
  } else if (req.session.user.id !== 9 && req.session.user.id !== 17) {
    userInstance.error.setResult([ERROR_CODES.NOT_ALLOWED]);
    return userInstance.error.returnApi(401);
  }

  try {
    userInstance
      .updateIsActive(userInstance.id, !userInstance.isActive)
      .then((result) => {
        return userInstance.success.returnApi();
      });
  } catch (error) {
    userInstance.error.catchError(error);
    return userInstance.error.returnApi();
  }
};
// exports.helloAgain = async function (req: any, res: any) {
//   const userInstance = new UserClass({}, req, res);

//   try {
//     await userInstance.getOld().then((users: IUserOld[]) => {
//       const mailerInstance = new MailerClass();

//       users.forEach((user, index) => {
//         setTimeout(function () {
//           mailerInstance.sendHelloAgain(user.fullName, user.email);
//           console.log('Enviando e-mail para ', user.email);
//         }, index * 1000);
//       });

//       userInstance.success.setResult(users);
//       return userInstance.success.returnApi();
//     });
//   } catch (error) {
//     userInstance.error.catchError(error);
//     return userInstance.error.returnApi();
//   }
// };
