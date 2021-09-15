import OnlineJudge from "./OnlineJudge";
import Codeforces from "./Codeforces";
import Hackerrank from "./Hackerrank";
import Kattis from "./Kattis";

export default class OnlineJudgeFactory {
  static getOnlineJudge(url: string): OnlineJudge | undefined {
    url = url.toLowerCase();
    if (url.includes("codeforces")) {
      return new Codeforces();
    } else if (url.includes("hackerrank")) {
      return new Hackerrank();
    } else if (url.includes("kattis")) {
      return new Kattis();
    } else {
      return undefined;
    }
  }
}
