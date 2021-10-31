export type OnlineJudge = 'codeforces' | 'hackerrank' | 'kattis';
export type ProgrammingLanguage = 'c' | 'cpp' | 'java' | 'python2' | 'python3' | 'javascript';

// Regular expresion to test URL
export const OnlineJudgesURLRegularExpression = {
  codeforces: new RegExp(
    /https:\/\/codeforces.com\/((contest|gym)\/\d+\/problem|(problemset\/problem\/\d+))\/([A-Za-z]|\d+)/,
  ),
  hackerrank: new RegExp(/https:\/\/www.hackerrank.com\/challenges\/\w+([\-]\w+)*\/problem/),
  kattis: new RegExp(/https:\/\/open.kattis.com\/problems\/\w+/),
};

export const SupportedProgrammingLanguages: Record<ProgrammingLanguage, ProgrammingLanguage> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  python2: 'python2',
  python3: 'python3',
  javascript: 'javascript',
};

export const fileTermination: Record<ProgrammingLanguage, string> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  python2: 'py',
  python3: 'py',
  javascript: 'js',
};

export const commentForLanguage: Record<ProgrammingLanguage, string> = {
  c: '//',
  cpp: '//',
  java: '//',
  python2: '#',
  python3: '#',
  javascript: '//',
};

export const SupportedOnlineJudges: Record<OnlineJudge, OnlineJudge> = {
  codeforces: 'codeforces',
  hackerrank: 'hackerrank',
  kattis: 'kattis',
};

// URL examples when submitting a problem URL
export const ExamplesOnlineJudgeProblemURL: Record<OnlineJudge, Array<string>> = {
  codeforces: ['https://codeforces.com/contest/285/problem/C', 'https://codeforces.com/gym/103270/problem/D'],
  hackerrank: ['https://www.hackerrank.com/challenges/ctci-array-left-rotation/problem'],
  kattis: ['https://open.kattis.com/problems/hello'],
};
