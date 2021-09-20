import { OnlineJudge } from './utils';
import * as appconfig from '../appconfig.json';

// True means available
export const JudgeAvailability: Record<string, Record<string, boolean>> = {};
appconfig.onlineJudges.forEach(judge => {
  JudgeAvailability[judge] = {};
  Object.keys(appconfig.judgeAccounts).forEach(account => {
    JudgeAvailability[judge][account] = true;
  });
});

export interface AccountAvailable {
  userID: string;
}

export async function getAccountAvailable(judge: OnlineJudge): Promise<AccountAvailable> {
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
