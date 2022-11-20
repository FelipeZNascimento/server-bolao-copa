import RefereeClass, { IRefereeRaw } from '../classes/referee';

exports.listAll = async function (req: any, res: any) {
  const refereeInstance = new RefereeClass(req, res);

  try {
    await refereeInstance.getAll().then((rawReferees: IRefereeRaw[]) => {
      const formattedReferees = rawReferees.map((referee) =>
        refereeInstance.formatRawReferee(referee)
      );
      refereeInstance.setReferees(formattedReferees);
      refereeInstance.success.setResult(refereeInstance.referees);
      return refereeInstance.success.returnApi();
    });
  } catch (error) {
    refereeInstance.error.catchError(error);
    return refereeInstance.error.returnApi();
  }
};