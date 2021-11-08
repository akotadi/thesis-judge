import { SupportedOnlineJudges } from '@utils/ts/types';

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
