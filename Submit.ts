import OnlineJudgeFactory from "./OnlineJudgeFactory/OnlineJudgeFactory";
import { ProblemVeredict, Language } from "./OnlineJudgeFactory/OnlineJudge";

export async function submit(
  filePath: string,
  problemURL: string,
  language: Language
): Promise<ProblemVeredict> {
  const oj = OnlineJudgeFactory.getOnlineJudge(problemURL);
  if (oj) {
    return await oj.submit(filePath, problemURL, language);
  } else {
    return {
      error: "Online Judge not supported",
      problemStatus: "",
      problemTime: "",
      problemMemory: "",
    };
  }
}
