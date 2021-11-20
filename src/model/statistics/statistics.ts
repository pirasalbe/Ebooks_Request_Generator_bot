import { CounterStatistics } from './counter-statistics';
import { HostStatistics } from './host-statistics';

export class Statistics {
  private static readonly SEPARATOR = '--------------\n';

  private inlineRequests: CounterStatistics;
  private textRequests: CounterStatistics;
  private hostStats: Map<string, HostStatistics>;
  private errors: Map<string, CounterStatistics>;

  constructor() {
    this.inlineRequests = new CounterStatistics();
    this.textRequests = new CounterStatistics();
    this.hostStats = new Map<string, HostStatistics>();
    this.errors = new Map<string, CounterStatistics>();
  }

  increaseInlineRequestCount(): void {
    this.inlineRequests.incrementCount();
  }

  increaseTextRequestCount(): void {
    this.textRequests.incrementCount();
  }

  private getHostStats(host: string): HostStatistics {
    if (!this.hostStats.has(host)) {
      this.hostStats.set(host, new HostStatistics());
    }

    return this.hostStats.get(host) as HostStatistics;
  }

  increaseHostRequestCount(host: string): void {
    this.getHostStats(host).incrementRequestCount();
  }

  increaseHostErrorCount(host: string): void {
    this.getHostStats(host).incrementErrorCount();
  }

  increaseErrorCount(error: string): void {
    if (!this.errors.has(error)) {
      this.errors.set(error, new CounterStatistics());
    }

    const stats: CounterStatistics = this.errors.get(
      error
    ) as CounterStatistics;
    stats.incrementCount();
  }

  toString(): string {
    let result: string = Statistics.SEPARATOR;
    result += '<b>Requests</b>:\n\n';

    result += 'Inline: ' + this.inlineRequests.toString() + '\n';
    result += 'Text: ' + this.textRequests.toString() + '\n\n';

    // host requests
    result += Statistics.SEPARATOR;
    result += '<b>Requests received</b>:\n\n';

    this.hostStats.forEach((stats: HostStatistics, host: string) => {
      result += 'Host: <code>' + host + '</code>\n';
      result += stats.toString();
      result += '\n\n';
    });

    // errors
    result += Statistics.SEPARATOR;
    result += '<b>Errors thrown</b>:\n\n';

    this.errors.forEach((stats: CounterStatistics, error: string) => {
      result += 'Error: <code>' + error + '</code>\n';
      result += 'Count: ' + stats.toString();
      result += '\n\n';
    });

    return result;
  }
}
