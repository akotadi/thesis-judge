import * as appconfig from '../../config/appconfig.json';
import { JudgeAvailability } from '../../utils/judge/judgeAvailable';
import { SupportedOnlineJudges } from '../../utils/ts/types';

export interface AccountAvailable {
  userID: string;
}

export async function getAccountAvailable(judge: SupportedOnlineJudges): Promise<AccountAvailable> {
  return new Promise((resolve, reject) => {
    const TIME_OUT = appconfig.availableAccountTimeOut;
    const RETRY_EVERY_MS = 1000;
    const accountsForJudge = JudgeAvailability[judge];
    let timePassed = 0;
    const IDInterval = setInterval(() => {
      if (timePassed === TIME_OUT) {
        clearInterval(IDInterval);
        reject({
          userID: undefined,
        });
        return;
      }
      for (const account in accountsForJudge) {
        const available = accountsForJudge[account as keyof typeof accountsForJudge];
        if (available) {
          accountsForJudge[account as keyof typeof accountsForJudge] = false;
          clearInterval(IDInterval);
          resolve({
            userID: account,
          });
          return;
        }
      }
      timePassed++;
    }, RETRY_EVERY_MS);
  });
}
