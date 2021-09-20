import * as express from 'express';
import * as got from 'got';
import * as fs from 'fs';
import { submit } from '../Submit';
import { ProblemVeredict } from '../OnlineJudgeFactory/OnlineJudge';
import { AccountAvailable, getAccountAvailable, JudgeAvailability } from './accountUtil';
import * as appconfig from '../appconfig.json';

import {
  SupportedProgrammingLanguages,
  ProgrammingLanguage,
  OnlineJudge,
  OnlineJudgesURLRegularExpression,
  SupportedOnlineJudges,
  ExamplesOnlineJudgeProblemURL,
  fileTermination,
  commentForLanguage,
} from './utils';
const app = express();
const requireAuthentication =
  appconfig['x-auth-token'] === undefined || appconfig['x-auth-token'] === '' ? false : true;

app.use(express.json());

function authorization(req, res, next) {
  const authHeader = req.headers['x-auth-token'];
  if (requireAuthentication && authHeader === undefined) {
    res.sendStatus(401); //Unauthorized
    res.okAuthorization = false;
    next();
    return;
  }
  if (requireAuthentication && authHeader !== appconfig['x-auth-token']) {
    res.sendStatus(403); // Forbidden
    res.okAuthorization = false;
    next();
    return;
  }
  res.okAuthorization = true;
  next();
}

async function problemExist(url: string): Promise<boolean> {
  try {
    const response = await got.get(url);
    const responseURL = response.url;
    const status = response.statusCode;
    return responseURL === url && status >= 200 && status <= 299;
  } catch (error) {
    return false;
  }
}

// Get all supported languages
app.get('/languages', authorization, (_req, res) => {
  if (res['okAuthorization'] === undefined || res['okAuthorization'] === false) return;
  const supportedLanguages: Array<string> = [];
  for (const languageRecord in SupportedProgrammingLanguages) {
    const language = SupportedProgrammingLanguages[languageRecord as keyof typeof SupportedProgrammingLanguages];
    supportedLanguages.push(language);
  }
  res.json({
    supportedLanguages: supportedLanguages,
  });
  return;
});

// Get all supported online judges
app.get('/judges', authorization, (_req, res) => {
  if (res['okAuthorization'] === undefined || res['okAuthorization'] === false) return;
  const supportedJudges: Array<string> = [];
  for (const onlineJudgeRecord in SupportedOnlineJudges) {
    const judge = SupportedOnlineJudges[onlineJudgeRecord as keyof typeof SupportedOnlineJudges];
    supportedJudges.push(judge);
  }
  res.json({
    supportedJudges: supportedJudges,
  });
  return;
});

app.post('/submit', authorization, async (req, res) => {
  if (res['okAuthorization'] === undefined || res['okAuthorization'] === false) return;
  const problemURL: string = req.body.problemURL;
  const langSolution: ProgrammingLanguage = req.body.langSolution.toLowerCase();
  const solution: string = req.body.solution;

  // Check three parameters are sent
  if (problemURL === undefined || langSolution === undefined || solution === undefined) {
    res.json({
      message: 'Expected three propierties in body: {problemURL : "", langSolution : "", solution : ""}',
    });
    return;
  }

  // Check programming language is supported
  if (!Object.values(SupportedProgrammingLanguages).includes(langSolution)) {
    res.json({
      message: `Programming Language not suported, see /languages`,
    });
    return;
  }

  // Check problem URL contains an online judge keyword
  let regexChecker: RegExp;
  let judge: OnlineJudge;
  if (problemURL.includes(SupportedOnlineJudges.codeforces)) {
    regexChecker = OnlineJudgesURLRegularExpression.codeforces;
    judge = SupportedOnlineJudges.codeforces;
  } else if (problemURL.includes(SupportedOnlineJudges.hackerrank)) {
    regexChecker = OnlineJudgesURLRegularExpression.hackerrank;
    judge = SupportedOnlineJudges.hackerrank;
  } else if (problemURL.includes(SupportedOnlineJudges.kattis)) {
    regexChecker = OnlineJudgesURLRegularExpression.kattis;
    judge = SupportedOnlineJudges.kattis;
  } else {
    res.json({
      message: 'Online judge not supported',
    });
    return;
  }

  // Check problem URL matches its corresponding judge pattern
  if (regexChecker.test(problemURL)) {
    // Check that the problem exist
    if (await problemExist(problemURL)) {
      // Check if the solution is base64 encoded
      let sol: string = solution;
      const base64_encoded = 'true' === req.query.base64_encoded?.toString().toLowerCase() ?? 'false';
      if (base64_encoded) {
        const b64string = solution;
        const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (!base64regex.test(b64string)) {
          res.json({
            message: `The solution is not a valid base64 string.`,
          });
          return;
        }
        sol = Buffer.from(b64string, 'base64').toString('utf-8');
      }

      // Trying to get an available account
      let username: string;
      let password: string;
      let account: AccountAvailable;

      try {
        account = await getAccountAvailable(judge);
        const user = appconfig.judgeAccounts[account.userID];
        username = user.nickname;
        password = user.password;
      } catch (error) {
        res.json({
          message: `Service is busy, try again later.`,
        });
        return;
      }

      const fileSolutionPath = `${username}_solution_${judge}.${fileTermination[langSolution]}`;

      try {
        const fileHash = new Date().valueOf();
        const solutionFile = `${commentForLanguage[langSolution]}${fileHash}\n${sol}`;

        fs.writeFileSync(fileSolutionPath, solutionFile);

        const veredict: ProblemVeredict = await submit(username, password, fileSolutionPath, problemURL, langSolution);
        // Make available the user
        JudgeAvailability[judge][account.userID as keyof typeof JudgeAvailability] = true;

        res.json({
          veredict: veredict,
        });

        fs.unlinkSync(fileSolutionPath);
      } catch (error) {
        res.json({
          message: `There was a problem creating or deleting the solution file`,
        });
      }
      return;
    } else {
      res.json({
        message: `The problem do not exist in ${judge}`,
      });
      return;
    }
  } else {
    res.json({
      message: `Problem URL does not match with a problem url pattern for ${judge}, examples [${ExamplesOnlineJudgeProblemURL[
        judge
      ].join(', ')}]`,
    });
    return;
  }
});

app.listen(appconfig.port, () => {
  console.log(`server in port ${appconfig.port}`);
});
