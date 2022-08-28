import TeamClass, { ITeam, ITeamRaw } from '../classes/team';

exports.listAll = async function (req: any, res: any) {
  const teamInstance = new TeamClass(req, res);

  try {
    await teamInstance.getAll().then((teams: ITeamRaw[]) => {
      teamInstance.pushTeams(teams);
      teamInstance.success.setResult(teamInstance.teams);
      return teamInstance.success.returnApi();
    });
  } catch (error) {
    teamInstance.error.catchError(error);
    return teamInstance.error.returnApi();
  }
};

exports.listById = async function (req: any, res: any) {
  const teamInstance = new TeamClass(req, res);
  const { id } = req.params;

  try {
    await teamInstance.getById(id).then((teams: ITeamRaw[]) => {
      teamInstance.pushTeams(teams);
      teamInstance.success.setResult(teamInstance.teams);
      return teamInstance.success.returnApi();
    });
  } catch (error) {
    teamInstance.error.catchError(error);
    return teamInstance.error.returnApi();
  }
};
