import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';

import { I18nUtil } from './../i18n/i18n-util';
import { HtmlUtil } from './html/html-util';
import { NullableHtmlElement } from './html/nullable-html-element';
import { HttpUtil } from './http/http-util';
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
            'User-Agent': HttpUtil.USER_AGENT_VALUE,
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
      } else if (response.statusCode == 301 || response.statusCode == 302) {
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
    return HttpUtil.processSuccessfulResponse(response, (data: string) => {
      return new Promise<string>((resolve, reject) => {
        this.processPage(url, data)
          .then((message: Message) => resolve(message.toString()))
          .catch((error) => reject(error));
      });
    });
  }

  private processPage(url: string, data: string): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      try {
        this.extractMessage(HtmlUtil.parseHTML(data as string))
          .then((message: Message) => {
            message.setUrl(url);
            resolve(message);
          })
          .catch((error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract info from HTML to generate the message
   * @param html HTML received from the URL
   * @returns Message
   */
  abstract extractMessage(html: HTMLElement): Promise<Message>;

  protected checkRequiredElements(
    elements: NullableHtmlElement[],
    customMessage = 'Missing required elements.'
  ): void {
    const indexNullElement = elements.findIndex((e) => e == null);
    if (indexNullElement >= 0) {
      console.error(indexNullElement);
      throw 'Error parsing page. ' + customMessage;
    }
  }

  protected isLanguageDefined(language: string | null | undefined): boolean {
    return language != null && language != undefined;
  }

  protected isLanguageTagRequired(language: string | null | undefined) {
    return this.isLanguageDefined(language) && language !== I18nUtil.ENGLISH;
  }
}
