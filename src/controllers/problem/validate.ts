import { Request, Response, NextFunction } from 'express';
import { OnlineJudgesURLRegularExpression } from '../../utils/constants/judge';
import problemExist from '../../utils/problem/validateProblem';
import { SupportedOnlineJudges } from '../../utils/ts/types';

export const validate = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  try {
    const { args } = req.body.input;
    const url = args.problemId;
    const judge = args.onlineJudge as SupportedOnlineJudges;

    if (judge in SupportedOnlineJudges && OnlineJudgesURLRegularExpression[judge].test(url)) {
      const isValid = await problemExist(url);
      res.json({
        isValid: isValid,
      });
    } else {
      res.json({
        isValid: false,
      });
    }
  } catch (err) {
    res.sendStatus(500);
  }
};
