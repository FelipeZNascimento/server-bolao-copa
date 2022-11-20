import PlayerClass, { IPlayerRaw } from '../classes/player';
import TeamClass, { ITeamRaw } from '../classes/team';

exports.listAll = async function (req: any, res: any) {
  const teamInstance = new TeamClass(req, res);

  try {
    await teamInstance.getAll().then((rawTeams: ITeamRaw[]) => {
      const formattedTeams = rawTeams.map((team) =>
        teamInstance.formatRawTeam(team)
      );
      teamInstance.setTeams(formattedTeams);
      teamInstance.success.setResult(teamInstance.teams);
      return teamInstance.success.returnApi();
    });
  } catch (error) {
    teamInstance.error.catchError(error);
    return teamInstance.error.returnApi();
  }
};

exports.listPlayersByTeam = async function (req: any, res: any) {
  const playerInstance = new PlayerClass(req, res);
  const { teamId } = req.params;

  try {
    await playerInstance.getByTeam(teamId).then((rawPlayers: IPlayerRaw[]) => {
      const formattedPlayers = rawPlayers.map((player) =>
        playerInstance.formatRawPlayer(player)
      );
      playerInstance.setPlayers(formattedPlayers);
      playerInstance.success.setResult({ players: playerInstance.players });
      return playerInstance.success.returnApi();
    });
  } catch (error) {
    playerInstance.error.catchError(error);
    return playerInstance.error.returnApi();
  }
};

exports.listById = async function (req: any, res: any) {
  const teamInstance = new TeamClass(req, res);
  const { id } = req.params;

  try {
    await teamInstance.getById(id).then((rawTeams: ITeamRaw[]) => {
      const formattedTeams = rawTeams.map((team) =>
        teamInstance.formatRawTeam(team)
      );
      teamInstance.setTeams(formattedTeams);
      teamInstance.success.setResult(teamInstance.teams);
      return teamInstance.success.returnApi();
    });
  } catch (error) {
    teamInstance.error.catchError(error);
    return teamInstance.error.returnApi();
  }
};
