import * as fs from 'fs';
import * as http from 'http';

export class HttpUtil {
  static readonly USER_AGENT =
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0';
  static readonly ACCEPT =
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  static readonly ACCEPT_ENCODING = 'compress';
  static readonly CONNECTION = 'keep-alive';

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
    response: http.IncomingMessage,
    callback: (data: string) => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let chunks: Buffer[] = [];
      response
        .on('data', (data: Buffer) => {
          chunks.push(data);
        })
        .on('error', (error) => {
          chunks = [];
          reject(error);
        })
        .on('end', () => {
          if (chunks.length > 0) {
            const pageData = Buffer.concat(chunks).toString();
            callback(pageData)
              .then((result: T) => resolve(result))
              .catch((error) => reject(error));
          } else {
            reject('No data obtained');
          }
        });
    });
  }
}
