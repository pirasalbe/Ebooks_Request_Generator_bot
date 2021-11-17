import { URL } from 'url';

import { ResolverException } from './../../../model/error/resolver-exception';
import { AmazonReroute } from './../../../model/resolver/amazon-reroute';
import { StatisticsService } from './../../statistics/statistic.service';
import { AmazonCaptchaResolverService } from './amazon-captcha-resolver.service';

export class AmazonRerouteService {
  private static readonly AMAZON_HOSTS: string[] = [
    'www.amazon.com',
    'www.amazon.co.uk',
    'www.amazon.ca',
    'www.amazon.com.au',
    'www.amazon.it',
    'www.amazon.de',
    'www.amazon.es',
    'www.amazon.fr',
  ];

  private statisticsService: StatisticsService;

  /**
   * Key: path
   * Value: array of host tried
   */
  private reroutedRequests: Map<string, string[]>;

  constructor(statisticsService: StatisticsService) {
    this.statisticsService = statisticsService;
    this.reroutedRequests = new Map<string, string[]>();
  }

  /**
   * Check if should reroute because of captcha
   * @param url Original URL
   * @param error Error obtained
   * @returns Should reroute
   */
  checkCaptcha(url: URL, error: ResolverException): AmazonReroute {
    let result: AmazonReroute = AmazonReroute.noReroute();

    if (
      error != undefined &&
      error.message == AmazonCaptchaResolverService.CAPTCHA_ERROR
    ) {
      result = this.getReroute(url, error.message);
    }

    return result;
  }

  checkServiceUnavailable(url: URL, error: string): AmazonReroute {
    let result: AmazonReroute = AmazonReroute.noReroute();

    if (String(error).includes('503')) {
      result = this.getReroute(url, String(error));
    }

    return result;
  }

  private getReroute(url: URL, error: string): AmazonReroute {
    let result: AmazonReroute = AmazonReroute.noReroute();

    // track the requested hosts
    this.addReroutedRequest(url);

    // find alternative hosts
    const alternativeHosts: string[] = this.getAlternativeHosts(url);

    // if hosts found, build new url
    if (alternativeHosts.length > 0) {
      const random: number = Math.floor(
        Math.random() * alternativeHosts.length
      );

      const newUrl: URL = new URL(url.toString());
      newUrl.host = alternativeHosts[random];

      // log info
      console.error(error);
      console.debug('Rerouting', url.toString(), newUrl.toString());

      // track errors
      this.statisticsService.getStats().increaseErrorCount(error);
      this.statisticsService
        .getStats()
        .increaseErrorCount('Reroute from ' + url.host + ' to ' + newUrl.host);
      // track the new host request
      this.statisticsService.getStats().increaseHostRequestCount(newUrl.host);

      result = AmazonReroute.reroute(newUrl);
    }

    return result;
  }

  private addReroutedRequest(url: URL): void {
    const path: string = url.pathname;
    let hosts: string[] = [];

    if (this.reroutedRequests.has(path)) {
      hosts = this.reroutedRequests.get(path) as string[];
    } else {
      this.reroutedRequests.set(path, hosts);
    }

    hosts.push(url.host);
  }

  private getAlternativeHosts(url: URL): string[] {
    const currentHost: string = url.host;
    const path: string = url.pathname;
    const hosts: string[] = this.reroutedRequests.get(path) as string[];

    const alternativeHosts: string[] = [];
    for (const host of AmazonRerouteService.AMAZON_HOSTS) {
      const index: number = hosts.findIndex((h: string) => h == currentHost);
      if (index < 0) {
        alternativeHosts.push(host);
      }
    }

    return alternativeHosts;
  }

  // TODO call this method and tests
  markRequestResolved(url: URL): void {
    const path: string = url.pathname;

    if (this.reroutedRequests.has(path)) {
      this.reroutedRequests.delete(path);
    }
  }
}
