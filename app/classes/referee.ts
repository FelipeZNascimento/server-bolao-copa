import ErrorClass from './error';
import QueryMaker from './queryMaker';
import SuccessClass from './success';
import { IConfederation } from './team';

export interface ICountry {
  id: number;
  abbreviation: string;
  isoCode: string;
  name: string;
}
export interface IReferee {
  id: number;
  idFifa: number;
  name: string;
  dateOfBirth: string;
  country: ICountry;
}

export interface ICountryRaw {
  country_id: number;
  country_abbreviation: string;
  country_iso_code: string;
  country_name: string;
}

export interface IRefereeRaw extends ICountryRaw {
  referee_id: number;
  referee_id_fifa: number;
  referee_name: string;
  referee_date_of_birth: string;
}

class RefereeClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  referees: IReferee[];

  constructor(req?: any, res?: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.referees = [];
  }

  setReferees(referees: IReferee[]) {
    this.referees = referees;
  }

  formatRawReferee(refereeRaw: IRefereeRaw) {
    return {
      id: refereeRaw.referee_id,
      idFifa: refereeRaw.referee_id_fifa,
      name: refereeRaw.referee_name,
      dateOfBirth: refereeRaw.referee_date_of_birth,
      country: {
        id: refereeRaw.country_id,
        abbreviation: refereeRaw.country_abbreviation,
        isoCode: refereeRaw.country_iso_code,
        name: refereeRaw.country_name
      }
    };
  }

  async getAll() {
    return super.runQuery(
      `SELECT referees.id as referee_id, referees.id_fifa as referee_id_fifa,
        referees.name as referee_name, referees.date_of_birth as referee_date_of_birth,
        countries.id as country_id, countries.iso_code as country_iso_code,
        countries.name as country_name, countries.abbreviation as country_abbreviation
        FROM referees
        LEFT JOIN countries ON countries.id = referees.id_country
        WHERE referees.id != 0
        ORDER BY referees.name ASC`
    );
  }
}

export default RefereeClass;
