import { Request, Response, NextFunction } from 'express';
import { SupportedProgrammingLanguages } from '../../utils/ts/types';

export const list = (_req: Request, res: Response, _next: NextFunction): void => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  res.json({
    supportedLanguages: Object.values(SupportedProgrammingLanguages),
  });
};
