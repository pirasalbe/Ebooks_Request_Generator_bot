import { createCuimpHttp, CuimpRequestConfig, CuimpResponse } from 'cuimp';
import * as fs from 'fs';
import { URL } from 'url';

/**
 * Response type for http requests
 */
export type HttpResponse<T = any> = CuimpResponse<T>;

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
  static processSuccessfulResponse<T, R>(
    response: HttpResponse<T>,
    callback: (data: T) => Promise<R>
  ): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      callback(response.data)
        .then((result: R) => resolve(result))
        .catch((error) => reject(error));
    });
  }

  /**
   * Standardize logic to execute fetch calls
   *
   * @param resource URL or string
   * @param config Request definition
   * @returns Response
   */
  static fetch<T = any>(
    resource: string | URL,
    config: Omit<CuimpRequestConfig, 'url'>
  ): Promise<HttpResponse<T>> {
    const client = createCuimpHttp({ descriptor: { browser: 'chrome' } });
    return client.request<T>({
      url: typeof resource === 'string' ? resource : resource.toString(),
      ...config,
    });
  }
}
