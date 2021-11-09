import { chromium, Page } from 'playwright-chromium';
import OnlineJudge from './OnlineJudge';
import * as appconfig from '../../../config/appconfig.json';
import { ProblemVeredict, ProgrammingLanguage, SupportedOnlineJudges } from '../../ts/types';

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
const LanguageAlias: Record<ProgrammingLanguage, string> = {
  c: 'select2-result-label-3',
  cpp: 'select2-result-label-5',
  java: 'select2-result-label-11',
  python2: 'select2-result-label-20',
  python3: 'select2-result-label-21',
  javascript: 'select2-result-label-12',
};

export default class Kattis extends OnlineJudge {
  readonly SESSION_PATH: string;
  readonly ONLINE_JUDGE_NAME = SupportedOnlineJudges.kattis;
  readonly LOGIN_URL = 'https://open.kattis.com/login/email';
  readonly VEREDICT_TIMEOUT = appconfig.veredictTimeOut * 1000;
  readonly USERNAME: string;
  readonly PASSWORD: string;

  constructor(username: string, password: string) {
    super();
    this.USERNAME = username;
    this.PASSWORD = password;
    this.SESSION_PATH = `${username}_kattis_session.json`;
  }

  async isLoggedIn(page: Page): Promise<boolean> {
    const querySelector = `text=${this.USERNAME ?? ''}`;
    return (await page.$(querySelector)) !== null;
  }

  async login(): Promise<boolean> {
    // headless : false to see the bot interacting with the browser
    const browser = await chromium.launch({ headless: true });
    const context = await this.restoreSession(browser);

    context.on('page', _ => this.closeAllOtherTabs(context));
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();
    page.setDefaultTimeout(appconfig.actionsTimeOut * 1000);

    try {
      await page.goto(this.LOGIN_URL);

      await page.fill('input[name="user"]', this.USERNAME ?? '');
      await page.fill('input[name="password"]', this.PASSWORD ?? '');
      await page.click('input[name="submit"]');
      await page.waitForSelector(`text=${this.USERNAME ?? ''}`);

      await this.saveSession(context);
      await browser.close();
      return true;
    } catch (error) {
      console.error(`[KattisLogin Error]: Message: ${error}`);
      return false;
    }
  }

  async uploadFile(filePath: string, page: Page, programmingLangAlias: ProgrammingLanguage): Promise<boolean> {
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
    } catch (error) {
      console.error(`[KattisUpload Error]: Message: ${error}`);
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
            const veredictHTMLString = table?.childNodes[0].childNodes[3].textContent?.toLowerCase();
            if (
              veredictHTMLString?.includes(KattisVeredicts.ACCEPTED) ||
              veredictHTMLString?.includes(KattisVeredicts.WRONG_ANSWER) ||
              veredictHTMLString?.includes(KattisVeredicts.COMPILATION_ERROR) ||
              veredictHTMLString?.includes(KattisVeredicts.RUN_TIME_ERROR) ||
              veredictHTMLString?.includes(KattisVeredicts.TIME_LIMIT_EXCEEDED) ||
              veredictHTMLString?.includes(KattisVeredicts.MEMORY_LIMIT_EXCEEDED)
            ) {
              return true;
            }
          } catch (error) {
            console.error(`[KattisGetVeredict Error]: Message: ${error}`);
          }
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
    } catch (error) {
      console.error(`[KattisGetSubmission Error]: Message: ${error}`);
      return {
        error: 'Could not get veredict',
        problemStatus: '',
        problemTime: '',
        problemMemory: '',
      };
    }
  }
}
