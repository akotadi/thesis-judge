export type OnlineJudge = 'codeforces' | 'hackerrank' | 'kattis';

export type ProgrammingLanguage = 'c' | 'cpp' | 'java' | 'python2' | 'python3' | 'javascript';

export enum SupportedProgrammingLanguages {
  c = 'c',
  cpp = 'cpp',
  java = 'java',
  python2 = 'python2',
  python3 = 'python3',
  javascript = 'javascript',
}

export enum SupportedOnlineJudges {
  codeforces = 'codeforces',
  hackerrank = 'hackerrank',
  kattis = 'kattis',
}

export interface ProblemVeredict {
  error: string;
  problemStatus: string;
  problemTime: string;
  problemMemory: string;
}

export interface AppConfiguration {
  port: number | null | undefined;
  testUrl: string;
  'x-auth-token': string | null | undefined;
  veredictTimeOut: number;
  actionsTimeOut: number;
  availableAccountTimeOut: number;
  onlineJudges: Array<string>;
  judgeAccounts: {
    [key: string]: {
      nickname: string;
      password: string;
    };
  };
}

export type SubmitRequestData = {
  problemURL: string;
  langSolution: SupportedProgrammingLanguages;
  solution: string;
  isBase64: boolean;
};

export type ProgrammingLanguageInfoType = {
  name: string;
  judge_id: number;
};

export type ProgrammingLanguageTestType = Record<SupportedProgrammingLanguages, ProgrammingLanguageInfoType>;
