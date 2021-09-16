import { chromium, Page } from 'playwright-chromium';
import OnlineJudge, { OnlineJudgeName, ProblemVeredict, Language } from './OnlineJudge';
import * as dotenv from 'dotenv';
dotenv.config();

// HTML indicators for veredicts finished execution(innerText)
enum KattisVeredicts {
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong answer',
  COMPILATION_ERROR = 'compile error',
  RUN_TIME_ERROR = 'run time error',
  TIME_LIMIT_EXCEEDED = 'time limit exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory limit exceeded',
}

// Ids for programming languages in div dropdown element
const LanguageAlias: Record<Language, string> = {
  c: 'select2-result-label-3',
  cpp: 'select2-result-label-5',
  java: 'select2-result-label-11',
  python2: 'select2-result-label-20',
  python3: 'select2-result-label-21',
  javascript: 'select2-result-label-12',
};

export default class Kattis extends OnlineJudge {
  readonly SESSION_PATH = 'kattis_session.json';
  readonly ONLINE_JUDGE_NAME = OnlineJudgeName.kattis;
  readonly LOGIN_URL = 'https://open.kattis.com/login/email';
  readonly VEREDICT_TIMEOUT = 20000;

  async isLoggedIn(page: Page): Promise<boolean> {
    const querySelector = `text=${process.env.user1Nickname ?? ''}`;
    return (await page.$(querySelector)) !== null;
  }

  async login(): Promise<boolean> {
    // headless : false to see the bot interacting with the browser
    const browser = await chromium.launch({ headless: true });
    const context = await this.restoreSession(browser);

    context.on('page', _ => this.closeAllOtherTabs(context));
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    try {
      await page.goto(this.LOGIN_URL);

      await page.fill('input[name="user"]', process.env.user1Nickname ?? '');
      await page.fill('input[name="password"]', process.env.user1Password ?? '');
      await page.click('input[name="submit"]');
      await page.waitForSelector(`text=${process.env.user1Nickname ?? ''}`);

      await this.saveSession(context);
      await browser.close();
      return true;
    } catch (e) {
      return false;
    }
  }

  async uploadFile(filePath: string, page: Page, programmingLangAlias: Language): Promise<boolean> {
    try {
      await page.click('a[class="kat-button kat-primary small"]');
      await page.waitForSelector('input[type=file]');
      const inputFile = await page.$('input[type=file]');
      if (inputFile) await inputFile.setInputFiles(filePath);

      await page.click('#s2id_language_select');
      await page.waitForSelector('#select2-drop');
      await page.click(`#${LanguageAlias[programmingLangAlias]}`);

      await page.click('input[type="submit"]');
      await page.waitForLoadState('domcontentloaded');
      return true;
    } catch (e) {
      return false;
    }
  }

  async getSubmissionVeredict(page: Page): Promise<ProblemVeredict> {
    try {
      // Wait for table of submission
      await page.waitForSelector('table[id="judge_table"]');
      // Get the table
      const table = await page.$('table[id="judge_table"] > tbody');

      //Wait at most 20 seconds for execution to be completed
      await page.waitForFunction(
        ({ table, KattisVeredicts }) => {
          try {
            const veredictHTMLString = table.childNodes[0].childNodes[3].textContent.toLowerCase();
            if (
              veredictHTMLString.includes(KattisVeredicts.ACCEPTED) ||
              veredictHTMLString.includes(KattisVeredicts.WRONG_ANSWER) ||
              veredictHTMLString.includes(KattisVeredicts.COMPILATION_ERROR) ||
              veredictHTMLString.includes(KattisVeredicts.RUN_TIME_ERROR) ||
              veredictHTMLString.includes(KattisVeredicts.TIME_LIMIT_EXCEEDED) ||
              veredictHTMLString.includes(KattisVeredicts.MEMORY_LIMIT_EXCEEDED)
            ) {
              return true;
            }
          } catch (e) {}
        },
        { table, KattisVeredicts },
        { timeout: this.VEREDICT_TIMEOUT },
      );
      // For the table, get the element that is in the first row, column four (status of the submission)
      const status = await page.$('table[id="judge_table"] > tbody > tr:nth-child(1) > td:nth-child(4)');
      // For the table, get the element that is in the first row, column five (time of the submission)
      const time = await page.$('table[id="judge_table"] > tbody > tr:nth-child(1) > td:nth-child(5)');

      return {
        error: '',
        problemStatus: (await status?.innerText()) ?? '',
        problemTime: (await time?.innerText()) ?? '',
        problemMemory: '',
      };
    } catch (e) {
      return {
        error: 'Could not get veredict',
        problemStatus: '',
        problemTime: '',
        problemMemory: '',
      };
    }
  }
}
