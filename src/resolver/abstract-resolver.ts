import * as http from 'http';
import * as https from 'https';
import { HTMLElement, parse } from 'node-html-parser';

import { Resolver } from './resolver';

export abstract class AbstractResolver implements Resolver {
  resolve(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      https.get(url, (response: http.IncomingMessage) => {
        let pageData: string | null = '';
        response
          .on('data', (data: string) => {
            pageData += data;
          })
          .on('error', (error) => {
            pageData = null;
            reject(error);
          })
          .on('end', () => {
            if (pageData !== null) {
              this.processPage(resolve, reject, pageData as string);
            }
          });
      });
    });
  }

  private processPage(
    resolve: (value: string | PromiseLike<string>) => void,
    reject: (reason?: any) => void,
    data: string
  ): void {
    try {
      resolve(this.extractMessage(this.parseHTML(data as string)));
    } catch (error) {
      reject(error);
    }
  }

  private parseHTML(data: string): HTMLElement {
    return parse(data);
  }

  /**
   * Extract info from HTML to generate the message
   * @param html HTML received from the URL
   * @returns Message
   */
  abstract extractMessage(html: HTMLElement): string;
}
