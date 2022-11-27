import ErrorClass from './error';
import SuccessClass from './success';
import QueryMaker from './queryMaker';
import { IPlayer } from './player';

export interface IEventRaw {
  event_description: string;
  event_gametime: string;
  event_id: number;
  event_id_match: number;
  event_id_team: number;
  player_id: number;
  player_id_fifa: number;
  player_id_fifa_picture: string;
  player_name: string;
  player_number: number;
  player_position_id: number;
  player_position_description: string;
  player_position_abbreviation: string;

  player_two_id: number;
  player_two_id_fifa: number;
  player_two_id_fifa_picture: string;
  player_two_name: string;
  player_two_number: number;
  player_two_position_id: number;
  player_two_position_description: string;
  player_two_position_abbreviation: string;
  event_info_id: number;
}

export interface IEvent {
  description: string;
  gametime: string;
  id: number;
  idMatch: number;
  idTeam: number;
  player: IPlayer;
  playerTwo: IPlayer | null;
  type: number;
}

class EventsClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  events: IEvent[];

  constructor(req?: any, res?: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.events = [];
  }

  setEvents(events: IEvent[]) {
    this.events = events;
  }

  formatRawEvent(eventRaw: IEventRaw): IEvent {
    let playerTwo = null;
    if (eventRaw.player_two_id) {
      playerTwo = {
        id: eventRaw.player_two_id,
        idFifa: eventRaw.player_two_id_fifa,
        idFifaPicture: eventRaw.player_two_id_fifa_picture,
        name: eventRaw.player_two_name,
        number: eventRaw.player_two_number,
        position: {
          id: eventRaw.player_two_position_id,
          description: eventRaw.player_two_position_description,
          abbreviation: eventRaw.player_two_position_abbreviation
        }
      };
    }

    return {
      description: eventRaw.event_description,
      gametime: eventRaw.event_gametime,
      id: eventRaw.event_id,
      idMatch: eventRaw.event_id_match,
      idTeam: eventRaw.event_id_team,
      player: {
        id: eventRaw.player_id,
        idFifa: eventRaw.player_id_fifa,
        idFifaPicture: eventRaw.player_id_fifa_picture,
        name: eventRaw.player_name,
        number: eventRaw.player_number,
        position: {
          id: eventRaw.player_position_id,
          description: eventRaw.player_position_description,
          abbreviation: eventRaw.player_position_abbreviation
        },
      },
      playerTwo: playerTwo,
      type: eventRaw.event_info_id
    }
  }

  async getAll() {
    return super.runQuery(
      `SELECT events.id as event_id, events.gametime as event_gametime, events.id_match as event_id_match,
      event_info.id as event_info_id, event_info.description as event_info_description, teams.id as event_id_team,
      
      player.id as player_id, player.name as player_name, player.number as player_number, player.id_fifa as player_id_fifa,
      player.id_fifa_picture as player_id_fifa_picture, player.id_position as player_id_position,
      position.description as player_position_description, position.abbreviation as player_position_abbreviation,
      
      player_two.id as player_two_id, player_two.name as player_two_name, player_two.number as player_two_number, player_two.id_fifa as player_two_id_fifa,
      player_two.id_fifa_picture as player_two_id_fifa_picture, player_two.id_position as player_two_id_position,
      position_two.description as player_two_position_description, position_two.abbreviation as player_two_position_abbreviation

      FROM events
      LEFT JOIN events_info as event_info ON events.id_event_info = event_info.id
      LEFT JOIN players as player ON events.id_player = player.id
      LEFT JOIN players as player_two ON events.id_player_two = player_two.id
      LEFT JOIN positions as position ON player.id_position = position.id
      LEFT JOIN positions as position_two ON player_two.id_position = position.id
      LEFT JOIN teams ON player.id_team = teams.id
      ORDER BY events.timestamp ASC, events.gametime ASC`
    );
  }

  async insert(
    eventType: number,
    playerId: number | null,
    playerTwoId: number | null,
    gametime: string,
    teamId: number | null
  ) {
    console.log('Here?', playerId, teamId);
    if (!playerId || !teamId) {
      return;
    }

    console.log('Inserting...');

    return super.runQuery(
      `INSERT IGNORE INTO events (id_event_info, id_player, id_player_two, gametime, id_match)
      VALUES(?, ?, ?, ?, ?)`,
      [eventType, playerId, playerTwoId, gametime, teamId]
    );
  }
}

export default EventsClass;
