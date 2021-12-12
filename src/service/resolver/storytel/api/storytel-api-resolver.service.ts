import * as http from 'http';
import { OutgoingHttpHeaders } from 'http';
import * as https from 'https';
import { URL } from 'url';
import { StorytelAuth } from '../../../../model/resolver/storytel/storytel-auth';

import { StorytelItemInformation } from '../../../../model/resolver/storytel/storytel-item-information';
import { HttpUtil } from '../../../../util/http-util';

export class StorytelApiResolverService {
  private static readonly INFO_URL =
    'https://www.storytel.com/api/getBookInfoForContent.action';

  private static readonly BOOK_ID_QUERY_PARAM = 'bookId';
  private static readonly CONSUMABLE_ID_QUERY_PARAM = 'consumableId';

  private defaultAuth: StorytelAuth;
  private auths: Map<string, StorytelAuth>;

  constructor(auths: string) {
    this.auths = new Map<string, StorytelAuth>();
    this.defaultAuth = {
      locale: '',
      userId: '',
      token: '',
    };
    this.fillAuths(auths);
  }

  /**
   * Fill the auth map
   * @param auths Auth string
   */
  private fillAuths(auths: string): void {
    const authList: StorytelAuth[] = JSON.parse(auths);

    if (authList.length > 0) {
      this.defaultAuth = authList[0];

      for (const auth of authList) {
        this.auths.set(auth.locale, auth);
      }
    }
  }

  private getAuth(locale: string): StorytelAuth {
    let result: StorytelAuth = this.defaultAuth;

    if (this.auths.has(locale)) {
      result = this.auths.get(locale) as StorytelAuth;
    }

    return result;
  }

  private getRequestHeader(cookies: string): OutgoingHttpHeaders {
    return {
      'User-Agent': HttpUtil.USER_AGENT,
      'Content-Type': 'application/json',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
      'Accept-Language': 'en-US,en;q=0.5',
      Cookies: cookies,
      Connection: 'keep-alive',
      Host: 'www.storytel.com',
      DNT: 1,
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'x-requested-with': 'XMLHttpRequest',
    };
  }

  /**
   * Get book information
   *
   * @param bookId Book identifier
   * @returns Information
   */
  getByBookId(
    bookId: string,
    cookies: string
  ): Promise<StorytelItemInformation> {
    const requestUrl: URL = new URL(StorytelApiResolverService.INFO_URL);
    requestUrl.searchParams.set(
      StorytelApiResolverService.BOOK_ID_QUERY_PARAM,
      bookId
    );

    return new Promise<StorytelItemInformation>((resolve, reject) => {
      https.get(
        requestUrl,
        {
          headers: this.getRequestHeader(cookies),
        },
        (response: http.IncomingMessage) => {
          if (response.statusCode == 200) {
            HttpUtil.processSuccessfulResponse(response, (data: string) => {
              const info: StorytelItemInformation = JSON.parse(
                data
              ) as StorytelItemInformation;
              return Promise.resolve(info);
            })
              .then((data: StorytelItemInformation) => {
                if (data.result == 'success') {
                  resolve(data);
                } else {
                  console.error(
                    requestUrl.toString(),
                    JSON.stringify(data),
                    cookies
                  );
                  reject('Error retrieving information.');
                }
              })
              .catch((error) => reject(error));
          } else {
            reject('Error ' + response.statusCode);
          }
        }
      );
    });
  }

  /**
   * Get book information
   *
   * @param consumableId Book identifier
   * @param locale Storytel locale
   * @param cookies Cookies for the request
   * @returns Information
   */
  getByConsumableId(
    consumableId: string,
    locale: string,
    cookies: string
  ): Promise<StorytelItemInformation> {
    const requestUrl: URL = new URL(StorytelApiResolverService.INFO_URL);
    requestUrl.searchParams.set(
      StorytelApiResolverService.CONSUMABLE_ID_QUERY_PARAM,
      consumableId
    );

    // authenticate
    const auth: StorytelAuth = this.getAuth(locale);
    requestUrl.searchParams.set('userid', auth.userId);
    requestUrl.searchParams.set('token', auth.token);

    return new Promise<StorytelItemInformation>((resolve, reject) => {
      https.get(
        requestUrl,
        {
          headers: this.getRequestHeader(cookies),
        },
        (response: http.IncomingMessage) => {
          if (response.statusCode == 200) {
            HttpUtil.processSuccessfulResponse(response, (data: string) => {
              const info: StorytelItemInformation = JSON.parse(
                data
              ) as StorytelItemInformation;
              return Promise.resolve(info);
            })
              .then((data: StorytelItemInformation) => {
                if (data.result == 'success') {
                  resolve(data);
                } else {
                  console.error(
                    requestUrl.toString(),
                    JSON.stringify(data),
                    cookies
                  );
                  reject('Error retrieving information.');
                }
              })
              .catch((error) => reject(error));
          } else {
            reject('Error ' + response.statusCode);
          }
        }
      );
    });
  }
}
