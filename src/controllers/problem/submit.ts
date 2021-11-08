import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { ExamplesOnlineJudgeProblemURL, OnlineJudgesURLRegularExpression } from '../../utils/constants/judge';
import problemExist from '../../utils/problem/validateProblem';
import { AccountAvailable, getAccountAvailable } from '../../utils/account/accountAvailable';
import { commentForLanguage, fileTermination } from '../../utils/constants/text';
import {
  AppConfiguration,
  ProblemVeredict,
  SubmitRequestData,
  SupportedOnlineJudges,
  SupportedProgrammingLanguages,
} from '../../utils/ts/types';
import { submitProblem } from '../../utils/problem/submitProblem';
import { JudgeAvailability } from '../../utils/judge/judgeAvailable';

import * as appconfig from '../../config/appconfig.json';

export const submit = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  const { problemURL, langSolution: langSolutionRaw, solution, isBase64 }: SubmitRequestData = req.body.input.args;

  const appConfiguration: AppConfiguration = appconfig;
  const langSolution: SupportedProgrammingLanguages = langSolutionRaw.toLowerCase() as SupportedProgrammingLanguages;
  const base64_encoded = isBase64;

  // Check three parameters are sent
  if (problemURL === undefined || langSolution === undefined || solution === undefined) {
    res.status(400).send('Expected three propierties in body: {problemURL : "", langSolution : "", solution : ""}');
    return;
  }

  // Check programming language is supported
  if (!Object.values(SupportedProgrammingLanguages).includes(langSolution)) {
    res.status(404).send(`Programming Language not supported, see /v1/language`);
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
    res.status(404).send(`Online judge not supported, see /v1/judge`);
    return;
  }

  // Check problem URL matches its corresponding judge pattern
  if (regexChecker.test(problemURL)) {
    // Check that the problem exist
    if (await problemExist(problemURL)) {
      // Check if the solution is base64 encoded
      let sol: string = solution;
      if (base64_encoded) {
        const b64string = solution;
        const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (!base64regex.test(b64string)) {
          res.status(400).send(`The solution is not a valid base64 string.`);
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
        console.error(`[CheckAccount Error]: Message: ${error}`);
        res.status(503).send(`Service is busy, try again later.`);
        return;
      }

      const fileSolutionPath = `${username}_solution_${judge}.${fileTermination[langSolution]}`;

      try {
        const fileHash = new Date().valueOf();
        const solutionFile = `${commentForLanguage[langSolution]}${fileHash}\n${sol}`;

        fs.writeFileSync(fileSolutionPath, solutionFile);
      } catch (error) {
        console.error(`[FileSync Error]: Message: ${error}`);
        res.status(500).send(`There was a problem creating the solution file.`);
        return;
      }

      try {
        const veredict: ProblemVeredict = await submitProblem(
          username,
          password,
          fileSolutionPath,
          problemURL,
          langSolution,
        );

        // Make available the user
        JudgeAvailability[judge][account.userID as keyof typeof JudgeAvailability] = true;

        res.json(veredict);
      } catch (error) {
        console.error(`[ProblemSubmit Error]: Message: ${error}`);
        res.status(500).send(`There was a problem submitting the solution file`);
        return;
      }

      try {
        fs.unlinkSync(fileSolutionPath);
      } catch (error) {
        console.error(`[FileSync Error]: Message: ${error}`);
        res.status(500).send(`There was a problem deleting the solution file.`);
        return;
      }

      return;
    } else {
      res.status(404).send(`The problem url do not exist in ${judge}`);
      return;
    }
  } else {
    res
      .status(400)
      .send(
        `Problem URL does not match with a problem url pattern for ${judge}, examples [${ExamplesOnlineJudgeProblemURL[
          judge
        ].join(', ')}]`,
      );
    return;
  }
};
