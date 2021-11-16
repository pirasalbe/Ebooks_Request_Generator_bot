import { Statistics } from './../../model/statistics/statistics';
import { DateUtil } from './../../util/date-util';

export class StatisticsService {
  private startup: Date;
  private hostStatsNextRoll: Date;

  private yesterdayHostStats: Map<string, Statistics>;
  private hostStats: Map<string, Statistics>;

  constructor() {
    this.startup = new Date();
    this.hostStatsNextRoll = new Date();
    this.yesterdayHostStats = new Map<string, Statistics>();
    this.hostStats = new Map<string, Statistics>();
  }

  private checkHostStats(host: string): void {
    const now = new Date();
    if (now.getTime() >= this.hostStatsNextRoll.getTime()) {
      this.yesterdayHostStats = this.hostStats;
      this.hostStats = new Map<string, Statistics>();

      const newDate = DateUtil.addDays(now, 1);
      newDate.setUTCHours(0, 0, 0, 0);
      this.hostStatsNextRoll = newDate;
    }

    if (!this.hostStats.has(host)) {
      this.hostStats.set(host, new Statistics());
    }
  }

  increaseHostRequestCount(host: string): void {
    this.checkHostStats(host);

    const stats: Statistics = this.hostStats.get(host) as Statistics;
    stats.incrementRequestCount();
  }

  toString(): string {
    let result = '<b>Startup</b>: ' + this.startup.toISOString();
    result += '\n--------------\n';
    result += '<b>Request received</b>:\n\n';

    this.hostStats.forEach(
      (stats: Statistics, host: string) =>
        (result += this.hostStatsToString(stats, host))
    );

    result += '--------------\n';
    result += '<b>Request received yesterday</b>:\n\n';
    this.yesterdayHostStats.forEach(
      (stats: Statistics, host: string) =>
        (result += this.hostStatsToString(stats, host))
    );

    return result;
  }

  private hostStatsToString(stats: Statistics, host: string): string {
    let result = '';

    result += 'Host: <code>' + host + '</code>\n';
    result += '\t' + stats.toString();
    result += '\n\n';

    return result;
  }
}
