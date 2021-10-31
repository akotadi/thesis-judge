import { Request, Response, NextFunction } from 'express';
import { SupportedOnlineJudges } from '../../utils/ts/types';

export const list = (_req: Request, res: Response, _next: NextFunction): Response | undefined => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  const supportedJudges: Array<string> = [];
  for (const onlineJudgeRecord in SupportedOnlineJudges) {
    const judge = SupportedOnlineJudges[onlineJudgeRecord as keyof typeof SupportedOnlineJudges];
    supportedJudges.push(judge);
  }
  res.json({
    supportedJudges,
  });
  return;
};
