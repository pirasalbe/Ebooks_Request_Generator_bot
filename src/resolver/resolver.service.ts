import { URL } from 'url';

import { Message } from './message';
import { Resolver } from './resolver';
import { SiteResolver } from './site-resolver.enum';

export class ResolverService {
  private resolvers: Record<SiteResolver, Resolver>;

  constructor(resolvers: Record<SiteResolver, Resolver>) {
    this.resolvers = resolvers;
  }

  resolve(link: string): Promise<Message[]> {
    let result: Promise<Message[]>;

    const url: URL | null = this.stringToUrl(link);

    if (url != null) {
      result = this.resolveMessages(url);
    } else {
      result = new Promise((resolve, reject) => {
        reject('Invalid link.');
      });
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
      result = new Promise((resolve, reject) => {
        reject('URL not supported.');
      });
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
