import { ProgrammingLanguageTestType, SupportedOnlineJudges } from '@utils/ts/types';

// Regular expresion to test URL
export const OnlineJudgesURLRegularExpression: Record<SupportedOnlineJudges, RegExp> = {
  codeforces: new RegExp(
    /https:\/\/codeforces.com\/((contest|gym)\/\d+\/problem|(problemset\/problem\/\d+))\/([A-Za-z]|\d+)/,
  ),
  hackerrank: new RegExp(/https:\/\/www.hackerrank.com\/challenges\/\w+([\-]\w+)*\/problem/),
  kattis: new RegExp(/https:\/\/open.kattis.com\/problems\/\w+/),
};

// URL examples when submitting a problem URL
export const ExamplesOnlineJudgeProblemURL: Record<SupportedOnlineJudges, Array<string>> = {
  codeforces: ['https://codeforces.com/contest/285/problem/C', 'https://codeforces.com/gym/103270/problem/D'],
  hackerrank: ['https://www.hackerrank.com/challenges/ctci-array-left-rotation/problem'],
  kattis: ['https://open.kattis.com/problems/hello'],
};

export enum Statuses {
  Queue = 1,
  Processing = 2,
  Accepted = 3,
  WrongAnswer = 4,
  TimeLimitExceeded = 5,
  CompilationError = 6,
  RuntimeErrorSIGSEGV = 7,
  RuntimeErrorSIGXFSZ = 8,
  RuntimeErrorSIGFPE = 9,
  RuntimeErrorSIGABRT = 10,
  RuntimeErrorNZEC = 11,
  RuntimeErrorOther = 12,
  InternalError = 13,
  ExecFormatError = 14,
}

export const PROGRAMMING_LANGUAGES: ProgrammingLanguageTestType = {
  c: {
    name: 'C',
    judge_id: 48,
  },
  cpp: {
    name: 'Cpp',
    judge_id: 52,
  },
  java: {
    name: 'Java',
    judge_id: 62,
  },
  javascript: {
    name: 'Javascript',
    judge_id: 63,
  },
  python2: {
    name: 'Python2',
    judge_id: 70,
  },
  python3: {
    name: 'Python3',
    judge_id: 71,
  },
};
