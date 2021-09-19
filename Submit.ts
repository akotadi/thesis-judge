import OnlineJudgeFactory from './OnlineJudgeFactory/OnlineJudgeFactory';
import { ProblemVeredict, Language } from './OnlineJudgeFactory/OnlineJudge';

export async function submit(username: string, password: string, filePath: string, problemURL: string, language: Language): Promise<ProblemVeredict> {
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
