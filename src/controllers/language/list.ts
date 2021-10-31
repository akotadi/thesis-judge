import { Request, Response, NextFunction } from 'express';
import { SupportedProgrammingLanguages } from '../../utils/ts/types';

export const list = (_req: Request, res: Response, _next: NextFunction): Response | undefined => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  const supportedLanguages: Array<string> = [];
  for (const languageRecord in SupportedProgrammingLanguages) {
    const language = SupportedProgrammingLanguages[languageRecord as keyof typeof SupportedProgrammingLanguages];
    supportedLanguages.push(language);
  }
  res.json({
    supportedLanguages,
  });
  return;
};
