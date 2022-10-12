import ErrorClass from './error';
import SuccessClass from './success';
import { myCache } from '../utilities/cache';

const puppeteer = require('puppeteer');

export type TNews = {
  title: string;
  resume: string;
  link: string;
  image: string;
  date: string;
};

class ScraperClass {
  error: ErrorClass;
  success: SuccessClass;

  news: TNews[];

  constructor(req: any, res: any) {
    this.error = new ErrorClass({ errors: [] }, req, res);
    this.success = new SuccessClass([], req, res);

    this.news = [];
  }

  setNews(news: TNews[]) {
    this.news = news;
  }

  delay(time: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }

  async scrape() {
    let browser = await puppeteer.launch({});
    let page = await browser.newPage();
    const news = [];

    await page.goto(
      'https://ge.globo.com/futebol/copa-do-mundo/ultimas-noticias/'
    );

    await page.click(
      '#feed-placeholder > div > div > div.load-more.gui-color-primary-bg > a'
    );
    await this.delay(3000);
    await page.click(
      '#feed-placeholder > div > div > div.load-more.gui-color-primary-bg > a'
    );
    await this.delay(3000);

    for (let j = 1; j < 4; j++) {
      for (let i = 1; i < 10; i++) {
        let newsElement = await page.waitForSelector(
          `#feed-placeholder > div > div > div._evg > div:nth-child(${j}) > div > div > div:nth-child(${i})`
        );

        let title, resume, link, image, date;

        try {
          title = await newsElement.$eval('a', (a: any) => a.textContent);
          resume = await newsElement.$eval(
            'div.feed-post-body-resumo',
            (div: any) => div.textContent
          );
          link = await newsElement.$eval('a', (a: any) => a.href);
          image = await newsElement.$eval('img', (img: any) => img.src);
          date = await newsElement.$eval(
            'span.feed-post-datetime',
            (div: any) => div.textContent
          );

          news.push({
            title,
            resume,
            link,
            image,
            date
          });
        } catch (error) {
          console.log("The element didn't appear [ignore]");
        }
      }
    }

    this.setNews(news);
    myCache.setNews(news);
    browser.close();
    return this.news;

    // How to autoscroll: https://stackoverflow.com/questions/51529332/puppeteer-scroll-down-until-you-cant-anymore
  }
}

export default ScraperClass;
// #c82ee33c2598bb6da7f8b875ee4ee5c6 > div > div.feed-post-body-title.gui-color-primary.gui-color-hover > div > a
