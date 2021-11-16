import * as http from 'http';

import { DateUtil } from '../../util/date-util';

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
    this.cookiesHeader =
      'session-id=134-4712298-1130624; sp-cdn="L5Z9:IT"; ubid-main=135-8368052-7206346; s_fid=1CDBD5D9344DE5E6-0E5CF874166BD1E4; sst-main=Sst1|PQEPnphlOTd4KjHA5jmHt_HUCdFjA4soJx2FkOknHwZmikxdY3W8MKiKgN5ds9LQ6XUkRlxjhleOGf_gvdR6Y2GzU2JJtn7n1e3QlVFRBYEuFsTMDKj0JlErtLxoZ0XJCVXqnoHEydRdStdVApmbXdNSW37MYwtXAICAxY9Xeo8T6YBomM7aNmMN8JH8Hm0t6cBk7szFQdGOkDgXmhEV6SH3i7rXwfdt_85XIxwbgt0H9LGvxYNBRZlvCgBgL0JYNRphNsrBM0rpWplJldUtWKDUZ3Unmr5HSKDr4UV4QA0Sxbg; i18n-prefs=USD; session-id-time=2082787201l; lc-main=en_US; session-token=uvhCok4ph6EI98vVez+hyPqH8gAUzpZKUgT2X002oQRD1Nt9SWb0pzyRHKnwDPVOtRzKOECDeB3keKX9Q01HKREi8vI9Cw8sE5rgf2f7fsmFd+IZxPnTSjsM7ZOk7LfXiiPiqDAiOgmV8eqFeteN97nCKcETRmWeGSMzgHr5Af3g0UNJK8zijXSKwIwMngd0; csm-hit=tb:s-PP7CPPQ2NGCS0MP7497Z|1636914960486&t:1636914961866&adb:adblk_yes';
    this.resetDate = DateUtil.addHours(new Date(), Cookies.MAX_AGE_HOURS);
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
