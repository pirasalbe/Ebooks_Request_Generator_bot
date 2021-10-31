import * as http from 'http';
import * as https from 'https';
import { HTMLElement, parse } from 'node-html-parser';

import { I18nUtil } from './../i18n/i18n-util';
import { Message } from './message';
import { Resolver } from './resolver';

export abstract class AbstractResolver implements Resolver {
  private cookies: Map<string, string>;
  private cookiesHeader: string;

  protected constructor() {
    this.cookies = new Map<string, string>();
    this.cookiesHeader = '';
  }

  resolve(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      https.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
            Cookie: this.cookiesHeader,
          },
        },
        (response: http.IncomingMessage) => {
          this.updateCookies(response.headers);
          this.processResponse(url, response)
            .then((message: string) => resolve(message))
            .catch((error) => reject(error));
        }
      );
    });
  }

  private updateCookies(headers: http.IncomingHttpHeaders): void {
    const setCookie: string[] | undefined = headers['set-cookie'];

    if (setCookie != undefined && setCookie.length > 0) {
      for (const cookies of setCookie) {
        const cookieInfo: string = cookies.split(';')[0];
        const cookiePart: string[] = cookieInfo.split('=');

        this.cookies.set(cookiePart[0], cookiePart[1]);
      }

      const cookiesArray: string[] = [];
      this.cookies.forEach((value: string, key: string) => {
        cookiesArray.push(key + '=' + value);
      });
      this.cookiesHeader = cookiesArray.join('; ');
    }
  }

  private processResponse(
    url: string,
    response: http.IncomingMessage
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (response.statusCode == 200) {
        // success
        this.processSuccessfulResponse(url, response)
          .then((message: string) => resolve(message))
          .catch((error) => reject(error));
      } else if (response.statusCode == 301) {
        // redirect
        this.resolve(response.headers.location as string)
          .then((message: string) => resolve(message))
          .catch((error) => reject(error));
      } else {
        // something went wrong
        reject('Error ' + response.statusCode);
      }
    });
  }

  private processSuccessfulResponse(
    url: string,
    response: http.IncomingMessage
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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
            this.processPage(url, pageData as string)
              .then((message: Message) => resolve(message.toString()))
              .catch((error) => reject(error));
          }
        });
    });
  }

  private processPage(url: string, data: string): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      try {
        const message: Message = this.extractMessage(
          this.parseHTML(data as string)
        );
        message.setUrl(url);
        resolve(message);
      } catch (error) {
        reject(error);
      }
    });
  }

  private parseHTML(data: string): HTMLElement {
    return parse(data);
  }

  /**
   * Extract info from HTML to generate the message
   * @param html HTML received from the URL
   * @returns Message
   */
  abstract extractMessage(html: HTMLElement): Message;

  protected addLanguageTag(
    message: Message,
    siteLanguage: string,
    language: string
  ): void {
    const languageLowerCase: string | null = I18nUtil.getKey(
      siteLanguage,
      language
    );
    // no need to add english tag
    if (languageLowerCase != null && languageLowerCase !== I18nUtil.ENGLISH) {
      message.addTag(languageLowerCase);
    }
  }
}
