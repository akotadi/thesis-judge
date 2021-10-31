import { ProgrammingLanguage } from '@utils/ts/types';

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
