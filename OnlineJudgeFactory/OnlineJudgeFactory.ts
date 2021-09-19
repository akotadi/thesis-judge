import OnlineJudge from './OnlineJudge';
import Codeforces from './Codeforces';
import Hackerrank from './Hackerrank';
import Kattis from './Kattis';

export default class OnlineJudgeFactory {
  static getOnlineJudge(username: string, password: string, url: string): OnlineJudge | undefined {
    url = url.toLowerCase();
    if (url.includes('codeforces')) {
      return new Codeforces(username, password);
    } else if (url.includes('hackerrank')) {
      return new Hackerrank(username, password);
    } else if (url.includes('kattis')) {
      return new Kattis(username, password);
    } else {
      return undefined;
    }
  }
}
