import OnlineJudgeFactory from '../../utils/judge/OnlineJudgeFactory/OnlineJudgeFactory';
import { ProblemVeredict, SupportedProgrammingLanguages } from '../../utils/ts/types';

export async function submitProblem(
  username: string,
  password: string,
  filePath: string,
  problemURL: string,
  language: SupportedProgrammingLanguages,
): Promise<ProblemVeredict> {
  const oj = OnlineJudgeFactory.getOnlineJudge(username, password, problemURL);
  if (oj) {
    return await oj.submit(filePath, problemURL, language);
  } else {
    return {
      error: 'Online Judge not supported',
      problemStatus: '',
      problemTime: '',
      problemMemory: '',
    };
  }
}
