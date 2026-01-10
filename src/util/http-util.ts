import * as fs from 'fs';
import { Impit, ImpitResponse, RequestInit } from 'impit';

export class HttpUtil {
  static readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  static readonly ACCEPT =
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

  static readonly ACCEPT_ENCODING = 'gzip, deflate, br';

  static readonly ACCEPT_LANGUAGE = 'en-US,en;q=0.9';

  static readonly CONNECTION = 'keep-alive';

  // Standard Sec-Fetch headers for a fresh page navigation
  static readonly SEC_FETCH_HEADERS = {
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    DNT: '1',
    'Cache-Control': 'max-age=0',
  };

  private constructor() {
    // util class
  }

  static saveResponse(data: string): void {
    fs.writeFile('index.html', data, (err: NodeJS.ErrnoException | null) => {
      if (err != null) {
        console.error('Cannot save file', err);
      }
    });
  }

  /**
   * Extract the response body as string and call the callback function with it
   *
   * @param response Response received
   * @param callback Function to call with the body
   * @returns Promise
   */
  static processSuccessfulResponse<T>(
    response: ImpitResponse,
    callback: (data: string) => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      response
        .text()
        .then((data) =>
          callback(data)
            .then((result: T) => resolve(result))
            .catch((error) => reject(error))
        )
        .catch((error) => reject(error));
    });
  }

  static fetch(
    resource: unknown,
    init?: RequestInit | undefined
  ): Promise<ImpitResponse> {
    const impit = new Impit({ browser: 'chrome' });
    return impit.fetch(resource, init);
  }
}
