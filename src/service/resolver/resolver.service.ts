import { URL } from 'url';

import { SiteResolver } from '../../model/resolver/site-resolver.enum';
import { Message } from '../../model/telegram/message';
import { StatisticsService } from './../statistics/statistic.service';
import { Resolver } from './resolver';

export class ResolverService {
  private resolvers: Record<SiteResolver, Resolver>;
  private statisticsService: StatisticsService;

  constructor(
    resolvers: Record<SiteResolver, Resolver>,
    statisticsService: StatisticsService
  ) {
    this.resolvers = resolvers;
    this.statisticsService = statisticsService;
  }

  resolve(link: string): Promise<Message[]> {
    let result: Promise<Message[]>;

    const url: URL | null = this.stringToUrl(link);

    if (url != null) {
      this.statisticsService.increaseHostRequestCount(url.host);
      result = this.resolveMessages(url);
    } else {
      result = Promise.reject('Invalid link.');
    }

    return result;
  }

  private stringToUrl(link: string): URL | null {
    let url: URL | null = null;

    try {
      url = new URL(link);
    } catch (error) {
      console.error('Invalid link', error);
    }

    return url;
  }

  private resolveMessages(url: URL): Promise<Message[]> {
    let result: Promise<Message[]>;

    const resolver: Resolver | null = this.getResolver(url);
    if (resolver != null) {
      result = resolver.resolve(url);
    } else {
      result = Promise.reject('URL not supported.');
    }

    return result;
  }

  /**
   * Get a resolved based on the url info
   * @param url Url to check
   * @returns Corrisponding resolver or null if no resolver was found
   */
  private getResolver(url: URL): Resolver | null {
    let resolver: Resolver | null = null;

    if (url.hostname.includes('amazon')) {
      resolver = this.resolvers[SiteResolver.AMAZON];
    } else if (url.hostname.includes('audible')) {
      resolver = this.resolvers[SiteResolver.AUDIBLE];
    } else if (url.hostname.includes('scribd')) {
      resolver = this.resolvers[SiteResolver.SCRIBD];
    } else if (url.hostname.includes('storytel')) {
      resolver = this.resolvers[SiteResolver.STORYTEL];
    } else if (url.hostname.includes('archive')) {
      resolver = this.resolvers[SiteResolver.ARCHIVE];
    } else if (url.hostname.includes('openlibrary')) {
      resolver = this.resolvers[SiteResolver.OPENBOOKS];
    }

    return resolver;
  }
}
