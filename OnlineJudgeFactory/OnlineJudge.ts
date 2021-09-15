import {
  chromium,
  ChromiumBrowser,
  ChromiumBrowserContext,
  Page,
} from "playwright-chromium";
import * as fs from "fs";

export type Language =
  | "c"
  | "cpp"
  | "java"
  | "python2"
  | "python3"
  | "javascript";

export enum OnlineJudgeName {
  codeforces = "codeforces",
  hackerrank = "hackerrank",
  kattis = "kattis",
}

export interface ProblemVeredict {
  error: string;
  problemStatus: string;
  problemTime: string;
  problemMemory: string;
}

export default abstract class OnlineJudge {
  abstract readonly SESSION_PATH: string;
  abstract readonly ONLINE_JUDGE_NAME: string;
  abstract readonly LOGIN_URL: string;
  abstract readonly VEREDICT_TIMEOUT: number;

  abstract isLoggedIn(page: Page): Promise<boolean>;
  abstract login(): Promise<boolean>;
  abstract uploadFile(
    filePath: string,
    page: Page,
    programmingLangAlias: Language
  ): Promise<boolean>;
  abstract getSubmissionVeredict(page: Page): Promise<ProblemVeredict>;

  // Read file that contains the information for the session
  getSession(): Array<{
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  }> {
    const sessionString = fs.readFileSync(this.SESSION_PATH).toString();
    const parsedSession = JSON.parse(sessionString);
    return parsedSession;
  }

  // Add a saved session to the browser
  async restoreSession(
    browser: ChromiumBrowser
  ): Promise<ChromiumBrowserContext> {
    const previousSession = fs.existsSync(this.SESSION_PATH);
    const context = await browser.newContext({
      userAgent: "chrome",
      viewport: null,
    });
    if (previousSession) {
      context.addCookies(this.getSession());
    }
    return context;
  }

  // Save the session in a file
  async saveSession(context: ChromiumBrowserContext): Promise<void> {
    const cookies = await context.cookies();
    fs.writeFile(
      this.SESSION_PATH,
      JSON.stringify(cookies, null, 2),
      async (err) => {
        if (err) {
          console.log(
            "Session information could not be written in",
            this.SESSION_PATH
          );
        }
      }
    );
  }

  async closeAllOtherTabs(context: ChromiumBrowserContext): Promise<void> {
    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
      pages[i].close();
    }
  }

  // Submit a problem (file) to a judge
  async submit(
    filePath: string,
    problemURL: string,
    programmingLangAlias: Language
  ): Promise<ProblemVeredict> {
    // headless : false to see the bot interacting with the browser
    const browser = await chromium.launch({ headless: true });
    const context = await this.restoreSession(browser);

    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    // Try to hit the problem URL
    try {
      await page.goto(problemURL);
    } catch (e) {
      return {
        error: `Could not navigate to: ${problemURL} `,
        problemStatus: "",
        problemTime: "",
        problemMemory: "",
      };
    }

    let loginSuccess: boolean = await this.isLoggedIn(page);

    // Not Logged in, try to login
    if (!loginSuccess) {
      loginSuccess = await this.login();
      // Try to hit the problem URL
      try {
        await context.clearCookies();
        await context.addCookies(this.getSession());
        await page.goto(problemURL);
        loginSuccess = await this.isLoggedIn(page);
      } catch (e) {
        return {
          error: `Could not navigate to: ${problemURL} `,
          problemStatus: "",
          problemTime: "",
          problemMemory: "",
        };
      }
    }

    if (loginSuccess) {
      let resultUploadFile: boolean = await this.uploadFile(
        filePath,
        page,
        programmingLangAlias
      );
      if (!resultUploadFile) {
        return {
          error: `File was not loaded`,
          problemStatus: "",
          problemTime: "",
          problemMemory: "",
        };
      } else {
        let veredict: ProblemVeredict = await this.getSubmissionVeredict(page);
        await this.saveSession(context);
        await browser.close();
        return veredict;
      }
    } else {
      return {
        error: `Could not login to the judge: ${this.ONLINE_JUDGE_NAME}`,
        problemStatus: "",
        problemTime: "",
        problemMemory: "",
      };
    }
  }
}
