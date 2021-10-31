import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { ExamplesOnlineJudgeProblemURL, OnlineJudgesURLRegularExpression } from '../../utils/constants/judge';
import problemExist from '../../utils/problem/validateProblem';
import { AccountAvailable, getAccountAvailable } from '../../utils/account/accountAvailable';
import { commentForLanguage, fileTermination } from '../../utils/constants/text';
import {
  AppConfiguration,
  ProblemVeredict,
  SupportedOnlineJudges,
  SupportedProgrammingLanguages,
} from '../../utils/ts/types';
import { submitProblem } from '../../utils/problem/submitProblem';
import { JudgeAvailability } from '../../utils/judge/judgeAvailable';

import * as appconfig from '../../config/appconfig.json';

export const submit = async (req: Request, res: Response, _next: NextFunction): Promise<Response | undefined> => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  const appConfiguration: AppConfiguration = appconfig;
  const problemURL: string = req.body.problemURL;
  const langSolution: SupportedProgrammingLanguages = req.body.langSolution.toLowerCase();
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
  let judge: SupportedOnlineJudges;
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
        const user = appConfiguration.judgeAccounts[account.userID];
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

        const veredict: ProblemVeredict = await submitProblem(
          username,
          password,
          fileSolutionPath,
          problemURL,
          langSolution,
        );
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
};
