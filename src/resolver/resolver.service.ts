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

    const url = new URL(link);

    const resolver: Resolver | null = this.getResolver(url);
    if (resolver) {
      result = resolver.resolve(url);
    } else {
      result = new Promise((resolve, reject) => {
        reject('Invalid URL');
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
    }

    return resolver;
  }
}
