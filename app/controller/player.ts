import axios from 'axios';
import { myCache } from '../utilities/cache';

// Classes
import { IMatch } from '../classes/match';
import PlayerClass, { IPlayerRaw } from '../classes/player';
import { IReferee } from '../classes/referee';
import { ITeam } from '../classes/team';

// Constants
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';

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

exports.getAllPlayers = async (req: any, res: any) => {
  const playerInstance = new PlayerClass(req, res);

  let matches: IMatch[] = [];
  let referees: IReferee[] = [];
  let teams: ITeam[] = [];
  if (myCache.has('matches') && myCache.has('referees') && myCache.has('teams')) {
    matches = myCache.get('matches');
    referees = myCache.get('referees');
    teams = myCache.get('teams');
  } else {
    playerInstance.error.setResult([ERROR_CODES.CACHE_ERROR]);
    return playerInstance.error.returnApi();
  }

  try {
    let allQueries: any[] = [];
    matches.forEach((match) => {
      if (match.round <= 1) {
        allQueries.push(
          axios.get(`https://api.fifa.com/api/v3/live/football/17/255711/285063/${match.idFifa}?language=en`)
        );
      }
    })

    const allResults = await Promise.allSettled(allQueries);
    const rejectedReasons: string[] = (allResults as PromiseRejectedResult[])
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason);

    if (rejectedReasons.length > 0) {
      playerInstance.error.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: rejectedReasons[0]
      });
      return playerInstance.error.returnApi();
    }

    const fulfilledValues: any[] = (allResults as PromiseFulfilledResult<any>[])
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value);

    const playersArray: any[] = [];
    fulfilledValues.forEach((item) => {
      if (item.data.HomeTeam.Players && item.data.HomeTeam.Players.length > 0) {
        const team = teams.find((team) => team.idFifa == item.data.HomeTeam.IdTeam)
        item.data.HomeTeam.Players.forEach((player: any) => {
          playersArray.push({
            fifaId: player.IdPlayer,
            fifaPictureId: player.PlayerPicture.Id.slice(0, 23) + '-' + player.PlayerPicture.Id.slice(23),
            teamId: team?.id,
            shirtNumber: player.ShirtNumber,

          })
        })
      }
      if (item.data.AwayTeam.Players && item.data.AwayTeam.Players.length > 0) {
        const team = teams.find((team) => team.idFifa == item.data.AwayTeam.IdTeam);
        item.data.AwayTeam.Players.forEach((player: any) => {
          playersArray.push({
            fifaId: player.IdPlayer,
            fifaPictureId: player.PlayerPicture.Id.slice(0, 23) + '-' + player.PlayerPicture.Id.slice(23),
            teamId: team?.id,
            shirtNumber: player.ShirtNumber
          })
        })
      }
    });

    // playersArray.forEach((player) => playerInstance.updateFifaPictureId(
    //   player.fifaPictureId,
    //   player.teamId,
    //   player.shirtNumber
    // ));

    // playersArray.forEach((player) => playerInstance.updateFifaId(
    //   player.fifaId,
    //   player.teamId,
    //   player.shirtNumber
    // ));

    playerInstance.success.setResult(playersArray);
    return playerInstance.success.returnApi();
  } catch (error: unknown) {
    playerInstance.error.catchError(error);
    return playerInstance.error.returnApi();
  }
};