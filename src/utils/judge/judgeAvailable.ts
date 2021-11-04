import * as appconfig from '../../config/appconfig.json';

// True means available
export const JudgeAvailability: Record<string, Record<string, boolean>> = {};
appconfig.onlineJudges.forEach(judge => {
  JudgeAvailability[judge] = {};
  Object.keys(appconfig.judgeAccounts).forEach(account => {
    JudgeAvailability[judge][account] = true;
  });
});
