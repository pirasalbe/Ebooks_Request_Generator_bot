import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

import { HttpUtil } from '../../../util/http-util';
import { StorytelItemInformation } from './../../../model/resolver/storytel-item-information';

export class StorytelInfoResolverService {
  private static readonly INFO_URL =
    'https://www.storytel.com/api/getBookInfoForContent.action';

  private static readonly BOOK_ID_QUERY_PARAM = 'bookId';

  /**
   * Get book information
   *
   * @param bookId Book identifier
   * @returns Information
   */
  getInfo(bookId: string, cookies: string): Promise<StorytelItemInformation> {
    const requestUrl: URL = new URL(StorytelInfoResolverService.INFO_URL);
    requestUrl.searchParams.set(
      StorytelInfoResolverService.BOOK_ID_QUERY_PARAM,
      bookId
    );

    return new Promise<StorytelItemInformation>((resolve, reject) => {
      https.get(
        requestUrl,
        {
          headers: {
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
          },
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
