import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';
import { StorytelAuth } from '../../../../model/resolver/storytel/storytel-auth';

import { StorytelItemInformation } from '../../../../model/resolver/storytel/storytel-item-information';
import { HttpUtil } from '../../../../util/http-util';

export class StorytelApiResolverService {
  private static readonly INFO_URL =
    'https://www.storytel.com/api/getBookInfoForContent.action';

  private static readonly BOOK_ID_QUERY_PARAM = 'bookId';
  private static readonly CONSUMABLE_ID_QUERY_PARAM = 'consumableId';

  private defaultAuth: StorytelAuth | null;
  private auths: Map<string, StorytelAuth>;

  constructor(auths: string) {
    this.auths = new Map<string, StorytelAuth>();
    this.defaultAuth = null;
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

  private getAuth(locale: string): StorytelAuth | null {
    let result: StorytelAuth | null = this.defaultAuth;

    const authKey = this.getAuthKey(locale);

    if (this.auths.has(authKey)) {
      result = this.auths.get(authKey) as StorytelAuth;
    }

    return result;
  }

  private getAuthKey(locale: string): string {
    const localeParts = locale.replace('books', '').split('/');

    if (localeParts.length < 4) {
      const localeCountryIndex = localeParts.findIndex((part) => part !== '');
      localeParts.splice(
        localeCountryIndex,
        0,
        localeParts[localeCountryIndex]
      );
    }

    return localeParts.join('/');
  }

  private getRequestHeader(cookies: string): OutgoingHttpHeaders {
    return {
      'User-Agent': HttpUtil.USER_AGENT,
      Accept: HttpUtil.ACCEPT,
      'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
      'Accept-Language': HttpUtil.ACCEPT_LANGUAGE,
      Cookie: cookies,
      Connection: HttpUtil.CONNECTION,
      Host: 'www.storytel.com',
      ...HttpUtil.SEC_FETCH_HEADERS,
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
      HttpUtil.fetch(requestUrl, { headers: this.getRequestHeader(cookies) })
        .then((response) => {
          if (response.status == 200) {
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
            reject('Error ' + response.status);
          }
        })
        .catch((err) => {
          console.error(
            'Error connecting to the API',
            requestUrl.toString(),
            err
          );
          reject('Connection error: ' + err);
        });
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
    const auth: StorytelAuth | null = this.getAuth(locale);
    if (auth != null) {
      requestUrl.searchParams.set('userid', auth.userId);
      requestUrl.searchParams.set('token', auth.token);
    }

    return new Promise<StorytelItemInformation>((resolve, reject) => {
      HttpUtil.fetch(requestUrl, { headers: this.getRequestHeader(cookies) })
        .then((response) => {
          if (response.status == 200) {
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
            reject('Error ' + response.status);
          }
        })
        .catch((err) => {
          console.error(
            'Error connecting to the API',
            requestUrl.toString(),
            err
          );
          reject('Connection error: ' + err);
        });
    });
  }
}
