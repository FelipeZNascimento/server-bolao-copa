import BetClass from '../classes/bet';
import ConfigClass from '../classes/config';
import MatchClass, { IMatch, IMatchRaw } from '../classes/match';
import { UNKNOWN_ERROR_CODE } from '../const/error_codes';

exports.default = async (req: any, res: any) => {
  const loggedUser = req.session.user;
  const configInstance = new ConfigClass(req, res);
  configInstance.setLoggedUser(loggedUser);
  try {
    const matchInstance = new MatchClass(req, res);
    const betInstance = new BetClass(req, res);

    const allQueries = [
      matchInstance.getAll(),
      betInstance.getAll(),
      betInstance.getFromLoggedUser(loggedUser ? loggedUser.id : null)
    ];

    const allResults = await Promise.allSettled(allQueries);
    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      configInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return configInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    const matches = fulfilledValues[0];
    betInstance.pushBets(fulfilledValues[1], false); // All available bets
    betInstance.pushBets(fulfilledValues[2], true); // LoggedUserBets
    const bets = betInstance.bets;
    const loggedUserBets = betInstance.loggedUserBets;

    matchInstance.pushMatches(matches, bets, loggedUserBets);
    configInstance.setMatches(matchInstance.matches);
    const buildObject = configInstance.buildConfigObject();
    configInstance.success.setResult(buildObject);
    return configInstance.success.returnApi();
  } catch (error: unknown) {
    configInstance.error.catchError(error);
    return configInstance.error.returnApi();
  }
};
