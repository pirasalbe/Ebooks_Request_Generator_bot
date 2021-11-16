import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../model/html/nullable-html-element';
import { Cookies } from '../../model/http/cookies';
import { Message } from '../../model/telegram/message';
import { HtmlUtil } from '../../util/html-util';
import { HttpUtil } from '../../util/http-util';
import { I18nUtil } from '../../util/i18n-util';
import { ResolverException } from './../../model/error/resolver-exception';
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
        this.prepareUrl(url),
        {
          headers: {
            'User-Agent': HttpUtil.USER_AGENT_VALUE,
            Accept: HttpUtil.ACCEPT,
            'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
            'Accept-Language': 'en-US,en;q=0.5',
            Host: url.host,
            DNT: 1,
            Connection: HttpUtil.CONNECTION,
            'Upgrade-Insecure-Requests': 1,
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
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

  /**
   * Prepare the URL for the call
   * @param url Url to edit
   * @returns Url ready for call
   */
  protected prepareUrl(url: URL): URL {
    return url;
  }

  /**
   * Retrieve the cookies of the host
   * @param host Host to call
   * @returns Cookies
   */
  private getCookies(host: string): string {
    if (!this.cookies.has(host)) {
      this.cookies.set(host, new Cookies());
    }

    const hostCookies: Cookies = this.cookies.get(host) as Cookies;

    return hostCookies.get();
  }

  /**
   * Updates the cookies of the host
   * @param host Host called
   * @param headers Headers from the response
   */
  private updateCookies(host: string, headers: http.IncomingHttpHeaders): void {
    const hostCookies: Cookies = this.cookies.get(host) as Cookies;

    hostCookies.update(headers);
  }

  /**
   * Process the response based on the status code
   *
   * @param url URL of the call
   * @param response Call response
   * @returns Promise with messages extracted
   */
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
        console.error(response.statusCode, response);
        reject(this.getErrorResponse(url, response.statusCode));
      }
    });
  }

  private getErrorResponse(url: URL, statusCode: number | undefined): string {
    let error = 'Error ' + statusCode;

    if (statusCode == 404) {
      // Not found
      error += ': Page not found';
    } else if (statusCode == 503) {
      // Service unavailable
      error +=
        ': ' +
        url.hostname +
        ' is unavailable. Wait a few seconds and try again.';
    }

    return error;
  }

  /**
   * Process a response with status 200
   *
   * @param url URL of the call
   * @param response Call response
   * @returns Promise with messages extracted
   */
  protected processSuccessfulResponse(
    url: URL,
    response: http.IncomingMessage
  ): Promise<Message[]> {
    return HttpUtil.processSuccessfulResponse(response, (data: string) => {
      return new Promise<Message[]>((resolve, reject) =>
        this.processPage(url, data)
          .then((messages: Message[]) => resolve(messages))
          .catch((error) => {
            const exception: ResolverException = {
              message: error,
              html: data,
            };
            reject(exception);
          })
      );
    });
  }

  /**
   * Process the body, which is an html page, to extract the messages
   *
   * @param url URL of the call
   * @param data The HTML page
   * @returns Promise with messages extracted
   */
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

  /**
   * Checks that the array has elements and that all elements are not null
   *
   * @param elements Elements to check
   * @param customMessage Custom error message
   */
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
