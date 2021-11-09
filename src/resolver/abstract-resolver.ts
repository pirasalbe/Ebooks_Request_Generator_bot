import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { I18nUtil } from './../i18n/i18n-util';
import { HtmlUtil } from './html/html-util';
import { NullableHtmlElement } from './html/nullable-html-element';
import { Cookies } from './http/cookies';
import { HttpUtil } from './http/http-util';
import { Message } from './message';
import { Resolver } from './resolver';

export abstract class AbstractResolver implements Resolver {
  /**
   * key: hostname
   * value: cookies
   */
  protected cookies: Map<string, Cookies>;

  protected constructor() {
    this.cookies = new Map<string, Cookies>();
  }

  resolve(url: URL): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      https.get(
        url,
        {
          headers: {
            'User-Agent': HttpUtil.USER_AGENT_VALUE,
            'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
            'Accept-Language': 'en-US,en;q=0.9',
            Cookie: this.getCookies(url.hostname),
          },
        },
        (response: http.IncomingMessage) => {
          this.updateCookies(url.hostname, response.headers);
          this.processResponse(url, response)
            .then((messages: Message[]) => resolve(messages))
            .catch((error) => reject(error));
        }
      );
    });
  }

  private getCookies(host: string): string {
    if (!this.cookies.has(host)) {
      this.cookies.set(host, new Cookies());
    }

    const hostCookies: Cookies = this.cookies.get(host) as Cookies;

    return hostCookies.get();
  }

  private updateCookies(host: string, headers: http.IncomingHttpHeaders): void {
    const hostCookies: Cookies = this.cookies.get(host) as Cookies;

    hostCookies.update(headers);
  }

  private processResponse(
    url: URL,
    response: http.IncomingMessage
  ): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      if (response.statusCode == 200) {
        // success
        this.processSuccessfulResponse(url, response)
          .then((messages: Message[]) => resolve(messages))
          .catch((error) => reject(error));
      } else if (response.statusCode == 301 || response.statusCode == 302) {
        // redirect
        this.resolve(new URL(response.headers.location as string))
          .then((messages: Message[]) => resolve(messages))
          .catch((error) => reject(error));
      } else {
        // something went wrong
        reject('Error ' + response.statusCode);
      }
    });
  }

  private processSuccessfulResponse(
    url: URL,
    response: http.IncomingMessage
  ): Promise<Message[]> {
    return HttpUtil.processSuccessfulResponse(response, (data: string) => {
      return new Promise<Message[]>((resolve, reject) => {
        this.processPage(url, data)
          .then((messages: Message[]) => resolve(messages))
          .catch((error) => reject(error));
      });
    });
  }

  private processPage(url: URL, data: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      try {
        this.extractMessages(url, HtmlUtil.parseHTML(data as string))
          .then((messages: Message[]) => {
            resolve(messages);
          })
          .catch((error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract info from HTML to generate the message
   * @param url URL of the page
   * @param html HTML received from the URL
   * @returns Message
   */
  abstract extractMessages(url: URL, html: HTMLElement): Promise<Message[]>;

  protected checkRequiredElements(
    elements: NullableHtmlElement[],
    customMessage = 'Missing required elements.'
  ): void {
    const indexNullElement = elements.findIndex((e) => e == null);
    if (elements.length == 0 || indexNullElement >= 0) {
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
