import { chromium, Page } from 'playwright-chromium';
import OnlineJudge, { OnlineJudgeName, ProblemVeredict, Language } from './OnlineJudge';
import * as dotenv from 'dotenv';
dotenv.config();

// HTML indicators for veredicts (class, innerText)
enum CodeForcesVeredicts {
  ACCEPTED = 'verdict-accepted',
  REJECTED = 'verdict-rejected',
  COMPILATION_ERROR = 'compilation error',
}

// Values for programming languages in SELECT element
const LanguageAlias: Record<Language, string> = {
  c: '43',
  cpp: '54',
  java: '60',
  python2: '7',
  python3: '31',
  javascript: '34',
};

export default class Codeforces extends OnlineJudge {
  readonly SESSION_PATH = 'codeforces_session.json';
  readonly ONLINE_JUDGE_NAME = OnlineJudgeName.codeforces;
  readonly LOGIN_URL = 'https://codeforces.com/enter';
  readonly VEREDICT_TIMEOUT = 20000;

  async isLoggedIn(page: Page): Promise<boolean> {
    const querySelector = 'a[href*=logout]';
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

      await page.click('text=Enter');
      await page.fill('input[name="handleOrEmail"]', process.env.user1Nickname ?? '');
      await page.fill('input[name="password"]', process.env.user1Password ?? '');
      await page.check('input[name="remember"]');
      await page.click('input[type="submit"]');
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
      const inputFile = await page.$('input[type=file]');
      if (inputFile) await inputFile.setInputFiles(filePath);
      await page.selectOption('select', {
        value: LanguageAlias[programmingLangAlias],
      });
      await page.click('input[style="width:10em;"][type=submit]');
      await page.waitForLoadState('domcontentloaded');
      const querySelector = 'span[class="error for__sourceFile"]';
      // You have submitted exactly the same code before
      if ((await page.$(querySelector)) !== null) {
        return false;
      } else {
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  async getSubmissionVeredict(page: Page): Promise<ProblemVeredict> {
    try {
      // Wait for table of submissions
      await page.waitForSelector('table[class="status-frame-datatable"]');
      // For the table, get the element that is in the first row, column six (status of the submission)
      const status = await page.$('table[class="status-frame-datatable"] > tbody > tr:nth-child(2) > td:nth-child(6)');
      //Wait at most 20 seconds for finally getting a status for the submission
      await page.waitForFunction(
        ({ status, CodeForcesVeredicts }) => {
          const veredictHTMLString = status.innerHTML.toLowerCase();
          if (
            veredictHTMLString.includes(CodeForcesVeredicts.ACCEPTED) ||
            veredictHTMLString.includes(CodeForcesVeredicts.REJECTED) ||
            veredictHTMLString.includes(CodeForcesVeredicts.COMPILATION_ERROR)
          ) {
            return true;
          }
        },
        { status, CodeForcesVeredicts },
        { timeout: this.VEREDICT_TIMEOUT },
      );
      // For the table, get the element that is in the first row, column seven (time of the submission)
      const time = await page.$('table[class="status-frame-datatable"] > tbody > tr:nth-child(2) > td:nth-child(7)');
      // For the table, get the element that is in the first row, column eight (memory of the submission)
      const memory = await page.$('table[class="status-frame-datatable"] > tbody > tr:nth-child(2) > td:nth-child(8)');

      return {
        error: '',
        problemStatus: (await status?.innerText()) ?? '',
        problemTime: (await time?.innerText()) ?? '',
        problemMemory: (await memory?.innerText()) ?? '',
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
