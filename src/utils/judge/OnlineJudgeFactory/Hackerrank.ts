import { chromium, Page } from 'playwright-chromium';
import OnlineJudge from './OnlineJudge';
import * as appconfig from '../../../config/appconfig.json';
import { ProblemVeredict, ProgrammingLanguage, SupportedOnlineJudges } from '../../ts/types';

// HTML indicators for veredicts finished execution(class)
enum HackerrankFinishedExecutionIndicators {
  ACCEPTED = 'congrats-wrapper',
  REJECTED = 'submission-error-wrapper',
}

// Values for programming languages in SELECT element
const LanguageAlias: Record<ProgrammingLanguage, string> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  python2: 'python',
  python3: 'python3',
  javascript: 'javascript',
};

export default class Hackerrank extends OnlineJudge {
  readonly SESSION_PATH: string;
  readonly ONLINE_JUDGE_NAME = SupportedOnlineJudges.hackerrank;
  readonly LOGIN_URL = 'https://www.hackerrank.com/auth/login';
  readonly VEREDICT_TIMEOUT = appconfig.veredictTimeOut * 1000;
  readonly USERNAME: string;
  readonly PASSWORD: string;

  constructor(username: string, password: string) {
    super();
    this.USERNAME = username;
    this.PASSWORD = password;
    this.SESSION_PATH = `${username}_hackerrank_session.json`;
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

      await page.fill('input[name="username"]', this.USERNAME ?? '');
      await page.fill('input[name="password"]', this.PASSWORD ?? '');
      await page.check('input[class="checkbox-input"]');
      await page.click('button[class="ui-btn ui-btn-large ui-btn-primary auth-button ui-btn-styled"]');
      await page.waitForSelector(`text=${this.USERNAME ?? ''}`);

      await this.saveSession(context);
      await browser.close();
      return true;
    } catch (e) {
      return false;
    }
  }

  async uploadFile(filePath: string, page: Page, programmingLangAlias: ProgrammingLanguage): Promise<boolean> {
    try {
      await page.click('text=Upload Code as File');
      const confirmModal = await page.$('text=Attn: Upload file');
      if (confirmModal) {
        await page.check('input[class="confirm-upload"]');
        await page.click('text=Yes');
      }

      page.on('filechooser', async fileChooser => {
        await fileChooser.setFiles(filePath);
      });

      await page.waitForSelector('text=Upload Dialog');
      await page.click('input[class="fake-input"]');
      await page.selectOption('select', {
        value: LanguageAlias[programmingLangAlias],
      });
      await page.click('button[class="ui-btn ui-btn-normal ui-btn-primary ui-btn-styled"]');
      await page.waitForLoadState('domcontentloaded');
      await page.click('text=Submit Code');
      return true;
    } catch (e) {
      return false;
    }
  }

  async getSubmissionVeredict(page: Page): Promise<ProblemVeredict> {
    try {
      // Wait for execution to start
      await page.waitForSelector('div[class="challenge-submission-wrapper"]');
      const finishedExecution = await page.$('div[class="challenge-submission-wrapper"]');
      //Wait at most 20 seconds for execution to be completed
      await page.waitForFunction(
        ({ finishedExecution, HackerrankFinishedExecutionIndicators }) => {
          const veredictHTMLString = finishedExecution?.innerHTML.toLowerCase();
          if (
            veredictHTMLString?.includes(HackerrankFinishedExecutionIndicators.ACCEPTED) ||
            veredictHTMLString?.includes(HackerrankFinishedExecutionIndicators.REJECTED)
          ) {
            return true;
          }
        },
        { finishedExecution, HackerrankFinishedExecutionIndicators },
        { timeout: this.VEREDICT_TIMEOUT },
      );
      // Get the status of the submission
      await page.click('text=Submissions');

      // For the table, get the element that is in the first row, column one (result of the submission)
      await page.waitForSelector('div[class="table-body"]');
      const status = await page.$('div[class="table-body"] > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)');

      return {
        error: '',
        problemStatus: (await status?.innerText()) ?? '',
        problemTime: '',
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
