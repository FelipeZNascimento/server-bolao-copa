const { promisify } = require('util');
const sql = require('../../sql/sql');
const asyncQuery = promisify(sql.query).bind(sql); // Node native promisify

class QueryMakerClass {
  runQuery(query: string, params?: any[]) {
    return asyncQuery(query, params);
  }
}

export default QueryMakerClass;
