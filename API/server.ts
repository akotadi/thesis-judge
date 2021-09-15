import express from "express";
import got from "got";
import * as fs from "fs";
import { submit } from "../Submit";
import { ProblemVeredict } from "../OnlineJudgeFactory/OnlineJudge";

import {
  SupportedProgrammingLanguages,
  ProgrammingLanguage,
  OnlineJudge,
  OnlineJudgesURLRegularExpression,
  SupportedOnlineJudges,
  ExamplesOnlineJudgeProblemURL,
  fileTermination,
} from "./utils";
const app = express();

app.use(express.json());

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
app.get("/languages", (req, res) => {
  let supportedLanguages: Array<string> = [];
  for (let languageRecord in SupportedProgrammingLanguages) {
    let language =
      SupportedProgrammingLanguages[
        languageRecord as keyof typeof SupportedProgrammingLanguages
      ];
    supportedLanguages.push(language);
  }
  res.json({
    supportedLanguages: supportedLanguages,
  });
  return;
});

// Get all supported online judges
app.get("/judges", (req, res) => {
  let supportedJudges: Array<string> = [];
  for (let onlineJudgeRecord in SupportedOnlineJudges) {
    let judge =
      SupportedOnlineJudges[
        onlineJudgeRecord as keyof typeof SupportedOnlineJudges
      ];
    supportedJudges.push(judge);
  }
  res.json({
    supportedJudges: supportedJudges,
  });
  return;
});

app.post("/submit", async (req, res) => {
  const problemURL: string = req.body.problemURL;
  const langSolution: ProgrammingLanguage = req.body.langSolution;
  const solution: string = req.body.solution;

  // Check three parameters are sent
  if (
    problemURL === undefined ||
    langSolution === undefined ||
    solution === undefined
  ) {
    res.json({
      message:
        "Expected three parameters: [problemURL, langSolution, solution]",
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
      message: "Online judge not supported",
    });
    return;
  }

  // Check problem URL matches its corresponding judge pattern
  if (regexChecker.test(problemURL)) {
    // Check that the problem exist
    if (await problemExist(problemURL)) {
      // Check if the solution is base64 encoded
      let sol: string = solution;
      const base64_encoded =
        "true" === req.query.base64_encoded?.toString().toLowerCase() ??
        "false";
      if (base64_encoded) {
        var b64string = solution;
        sol = Buffer.from(b64string, "base64").toString("utf-8");
      }

      const fileSolutionPath = `solution.${fileTermination[langSolution]}`;

      try {
        fs.writeFileSync(fileSolutionPath, sol);

        let veredict: ProblemVeredict = await submit(
          fileSolutionPath,
          problemURL,
          langSolution
        );

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
      ].join(", ")}]`,
    });
    return;
  }
});

app.listen(3000, () => {
  console.log("server in port 3000");
});
