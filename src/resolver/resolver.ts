import { URL } from 'url';

import { Message } from './message';

export interface Resolver {
  /**
   * Resolve the request from the website
   * @param url Url to resolve
   */
  resolve(url: URL): Promise<Message[]>;
}
