import * as User from '../model/user';
import { IUser } from '../model/types';

const checkExistingValues = async (
  email: string,
  nickname: string,
  loggedUserId = null
) => {
  const allQueries = [
    User.checkEmail(email, loggedUserId || ''),
    User.checkNickname(nickname, loggedUserId || '')
  ];

  const allResults = await Promise.allSettled(allQueries);
  const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
    .filter((res) => res.status === 'rejected')
    .map((res) => res.reason);

  if (rejectedReasons.length > 0) {
    throw new Error(rejectedReasons[0]);
  }

  const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
    .filter((res) => res.status === 'fulfilled')
    .map((res) => res.value);

  let errorMessage = '';
  if (fulfilledValues[0].length > 0) {
    errorMessage += 'Email já está sendo usado.';
  }

  if (fulfilledValues[1].length > 0) {
    errorMessage += ' Apelido já está sendo usado.';
  }

  return errorMessage;
};

exports.listAll = async function (req: any, res: any) {
  try {
    await User.getAll().then((list: IUser[]) => {
      res.send(list);
    });
  } catch (error) {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }

    console.log(result);
    res.status(400).send(result);
  }
};

exports.listById = async function (req: any, res: any) {
  const { id } = req.params;
  //   if (req.session.user) {
  //     User.updateLastOnlineTime(req.session.user.id);
  //   }

  try {
    await User.getById(id).then((user: IUser) => {
      res.send(user);
    });
  } catch (error) {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }

    console.log(result);
    res.status(400).send(result);
  }
};

exports.register = async function register(req: any, res: any) {
  const userData: IUser = User.initialize(req.body);
  try {
    if (!userData.email || !userData.password || !userData.nickname) {
      throw new Error('Missing parameters');
    }
    const checkResult = await checkExistingValues(
      userData.email,
      userData.nickname
    );

    if (checkResult !== '') {
      throw new Error(checkResult);
    }

    await User.register(userData).then(async (result: any) => {
      userData.id = result.insertId;
      await User.registerInfo(userData).then(async () => {
        await User.login(userData.email, userData.password).then(
          (loginResult: IUser[]) => {
            if (loginResult.length > 0) {
              const newUser = User.initialize(loginResult[0]);
              req.session.user = newUser;

              // User.updateLastOnlineTime(newUser.id);
              res.send(newUser);
            } else {
              res.send(null);
            }
          }
        );
      });
    });
  } catch (error) {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }

    console.log(result);
    res.status(400).send(result);
  }
};

exports.login = async function (req: any, res: any) {
  if (req.session.user) {
    return res.status(400).send('User already logged in.');
  }

  const userData: IUser = User.initialize(req.body);

  try {
    if (!userData.email || !userData.password) {
      throw new Error('Missing parameters');
    }
    await User.login(userData.email, userData.password).then(
      (loginResult: IUser[]) => {
        if (loginResult.length > 0) {
          req.session.user = User.initialize(loginResult[0]);
          res.send(loginResult[0]);
        } else {
          res.send(null);
        }
      }
    );
  } catch (error) {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }

    console.log(result);
    res.status(400).send(result);
  }
};

exports.logout = function (req: any, res: any) {
  if (!req.session.user) {
    return res.status(400).send('Logout: User not found.');
  }

  req.session.destroy();
  res.status(200).send(true);
};
