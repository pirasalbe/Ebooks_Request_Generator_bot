import * as http from 'http';

export class Cookies {
  private static readonly MAX_AGE_HOURS = 4;

  private cookies: Map<string, string>;
  private cookiesHeader: string;
  private resetDate: Date;

  constructor() {
    this.cookies = new Map<string, string>();
    this.cookiesHeader = '';
    this.resetDate = new Date();
    this.resetCookies();
  }

  private resetCookies() {
    this.cookies = new Map<string, string>();
    this.cookiesHeader = '';
    this.resetDate = this.calculateResetDate(Cookies.MAX_AGE_HOURS);
  }

  private calculateResetDate(hours: number): Date {
    const now: Date = new Date();
    now.setTime(now.getTime() + hours * 60 * 60 * 1000);
    return now;
  }

  /**
   * Update the cookies with the value from the response header
   *
   * @param headers Response headers
   */
  update(headers: http.IncomingHttpHeaders): void {
    const setCookie: string[] | undefined = headers['set-cookie'];

    if (setCookie != undefined && setCookie.length > 0) {
      for (const cookie of setCookie) {
        const cookieInfo: string = cookie.split(';')[0];
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

  /**
   * Get the cookie header for a new request.
   *
   * @returns Cookie header
   */
  get(): string {
    const now: Date = new Date();

    if (now.getTime() > this.resetDate.getTime()) {
      this.resetCookies();
    }

    return this.cookiesHeader;
  }

  toString(): string {
    return this.cookiesHeader;
  }
}
