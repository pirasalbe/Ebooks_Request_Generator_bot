import { URL } from 'url';

import { Resolver } from './resolver';
import { SiteResolver } from './site-resolver.enum';

export class ResolverService implements Resolver {
  private resolvers: Record<SiteResolver, Resolver>;

  constructor(resolvers: Record<SiteResolver, Resolver>) {
    this.resolvers = resolvers;
  }

  resolve(url: string): Promise<string> {
    let result: Promise<string>;

    const urlObject = new URL(url);

    const resolver: Resolver | null = this.getResolver(urlObject);
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
    }

    return resolver;
  }
}
