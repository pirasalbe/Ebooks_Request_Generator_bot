import { Statistics } from './../../model/statistics/statistics';
import { DateUtil } from './../../util/date-util';

export class StatisticsService {
  private static readonly SEPARATOR = '<code>=====================</code>\n';

  private startup: Date;
  private nextStatsRoll: Date;

  private yesterdayStats: Statistics;
  private stats: Statistics;

  constructor() {
    this.startup = new Date();
    this.nextStatsRoll = new Date();
    this.yesterdayStats = new Statistics();
    this.stats = new Statistics();
  }

  private checkStats(): void {
    const now = new Date();
    if (now.getTime() >= this.nextStatsRoll.getTime()) {
      this.yesterdayStats = this.stats;
      this.stats = new Statistics();

      const newDate = DateUtil.addDays(now, 1);
      newDate.setUTCHours(0, 0, 0, 0);
      this.nextStatsRoll = newDate;
    }
  }

  getStats(): Statistics {
    this.checkStats();

    return this.stats;
  }

  toString(): string {
    let result = '<b>Startup</b>: ' + this.startup.toISOString() + '\n';
    result += this.stats.toString();
    result += StatisticsService.SEPARATOR;
    result += '<b>Yesterday stats</b>\n\n';
    result += this.yesterdayStats.toString();

    return result;
  }
}
