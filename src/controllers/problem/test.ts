import { Request, Response, NextFunction } from 'express';
import { AppConfiguration, SupportedProgrammingLanguages } from '../../utils/ts/types';
import * as got from 'got';
import * as appconfig from '../../config/appconfig.json';
import { PROGRAMMING_LANGUAGES } from '../../utils/constants/judge';

export const test = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (res.get('authorized') === undefined || res.get('authorized') === 'false') return;

  try {
    const { args } = req.body.input;
    const { stdin, solution } = args;
    const programmingLanguage = args.programmingLanguage.toLowerCase() as SupportedProgrammingLanguages;
    const isBase64 = args.isBase64 ?? false;
    const appConfiguration: AppConfiguration = appconfig;

    if (programmingLanguage in SupportedProgrammingLanguages) {
      const urlTest = `${appConfiguration.testUrl}submissions/?base64_encoded=${isBase64.toString()}&wait=true`;
      const { body, statusCode } = await got.post(urlTest, {
        headers: {
          'x-auth-token': appConfiguration['x-auth-token'] ?? '',
        },
        body: {
          source_code: solution,
          stdin,
          language_id: PROGRAMMING_LANGUAGES[programmingLanguage].judge_id,
        },
        json: true,
      });
      if (statusCode !== 201) {
        res.sendStatus(statusCode);
      } else {
        const { stdout, time, memory, status } = body;
        const { description } = status;
        res.json({
          stdout,
          time,
          memory,
          status: description,
        });
      }
    } else {
      res.sendStatus(400);
    }
  } catch (error) {
    console.error(`[ProblemTest Error]: Message: ${error}`);
    res.sendStatus(500);
  }
};
