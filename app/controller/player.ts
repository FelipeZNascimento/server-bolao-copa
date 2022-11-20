import PlayerClass, { IPlayerRaw } from '../classes/player';

exports.listAll = async function (req: any, res: any) {
  const playerInstance = new PlayerClass(req, res);

  try {
    await playerInstance.getAll().then((rawPlayers: IPlayerRaw[]) => {
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
