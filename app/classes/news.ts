import ErrorClass from './error';
import SuccessClass from './success';
import QueryMaker from './queryMaker';

export type TNews = {
  ge_id: string;
  title: string;
  summary: string;
  link: string;
  image: string;
};

class NewsClass extends QueryMaker {
  error: ErrorClass;
  success: SuccessClass;

  constructor(req: any, res: any) {
    super();

    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);
  }

  async getAll() {
    return super.runQuery(
      `SELECT * FROM news
      ORDER BY timestamp DESC, id DESC
      LIMIT 18`
    );
  }

  async insert(news: TNews) {
    return super.runQuery(
      `INSERT IGNORE INTO news (ge_id, title, summary, link, image)
        VALUES(?, ?, ?, ?, ?)`,
      [news.ge_id, news.title, news.summary, news.link, news.image]
    );
  }
}

export default NewsClass;
