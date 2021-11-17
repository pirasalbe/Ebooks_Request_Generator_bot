import { Statistics } from './../../model/statistics/statistics';
import { DateUtil } from './../../util/date-util';

export class StatisticsService {
  private startup: Date;
  private hostStatsNextRoll: Date;

  private yesterdayStats: Statistics;
  private stats: Statistics;

  constructor() {
    this.startup = new Date();
    this.hostStatsNextRoll = new Date();
    this.yesterdayStats = new Statistics();
    this.stats = new Statistics();
  }

  private checkStats(): void {
    const now = new Date();
    if (now.getTime() >= this.hostStatsNextRoll.getTime()) {
      this.yesterdayStats = this.stats;
      this.stats = new Statistics();

      const newDate = DateUtil.addDays(now, 1);
      newDate.setUTCHours(0, 0, 0, 0);
      this.hostStatsNextRoll = newDate;
    }
  }

  getStats(): Statistics {
    this.checkStats();

    return this.stats;
  }

  toString(): string {
    let result = '<b>Startup</b>: ' + this.startup.toISOString() + '\n';
    result += this.stats.toString();
    result += this.yesterdayStats.toString();

    return result;
  }
}
