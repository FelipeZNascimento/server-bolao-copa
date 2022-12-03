import ErrorClass from './error';
import SuccessClass from './success';
import QueryMaker from './queryMaker';
import { IPlayer } from './player';

export interface IEventRaw {
  event_id: number;
  event_id_match: number;
  event_id_team: number;
  event_description: string;
  event_gametime: string;

  player_id: number;
  player_id_fifa: number;
  player_id_fifa_picture: string;
  player_name: string;
  player_number: number;
  player_date_of_birth: string,
  player_height: number,
  player_weight: number,

  player_position_id: number;
  player_position_description: string;
  player_position_abbreviation: string;

  player_club_name: string,

  player_club_country_id: number,
  player_club_country_name: string,
  player_club_country_name_en: string,
  player_club_country_abbreviation: string,
  player_club_country_abbreviation_en: string,
  player_club_country_iso_code: string,

  event_info_id: number;
}

export interface IEvent {
  description: string;
  gametime: string;
  id: number;
  idMatch: number;
  idTeam: number;
  player: IPlayer;
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
        birth: eventRaw.player_date_of_birth,
        height: eventRaw.player_height,
        weigth: eventRaw.player_weight,
        club: {
          name: eventRaw.player_club_name,
          country: {
            id: eventRaw.player_club_country_id,
            isoCode: eventRaw.player_club_country_iso_code,
            name: eventRaw.player_club_country_name,
            nameEn: eventRaw.player_club_country_name_en,
            abbreviation: eventRaw.player_club_country_abbreviation,
            abbreviationEn: eventRaw.player_club_country_abbreviation_en
          }
        },
        position: {
          id: eventRaw.player_position_id,
          description: eventRaw.player_position_description,
          abbreviation: eventRaw.player_position_abbreviation
        },
      },
      type: eventRaw.event_info_id
    }
  }

  async getAll() {
    return super.runQuery(
      `SELECT events.id as event_id, events.gametime as event_gametime, events.id_match as event_id_match,
      event_info.id as event_info_id, teams.id as event_id_team,
      
      player.id as player_id, player.name as player_name, player.number as player_number, player.id_fifa as player_id_fifa,
      player.id_fifa_picture as player_id_fifa_picture, player.id_position as player_position_id,
      position.description as player_position_description, position.abbreviation as player_position_abbreviation,
      player.date_of_birth as player_date_of_birth, player.height as player_height, player.weight as player_weight,
      club_country.iso_code as player_club_country_iso_code, clubs.name as player_club_name,
      
      club_country.name as player_club_country_name, club_country.name_en as player_club_country_name_en,
      club_country.abbreviation as player_club_country_abbreviation,
      club_country.abbreviation_en as player_club_country_abbreviation_en,
      clubs.id_country as player_club_country_id

      FROM events
      LEFT JOIN events_info as event_info ON events.id_event_info = event_info.id
      LEFT JOIN players as player ON events.id_player = player.id
      LEFT JOIN positions as position ON player.id_position = position.id
      LEFT JOIN clubs ON clubs.id = player.id_club
      LEFT JOIN countries AS club_country ON club_country.id = clubs.id_country

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
