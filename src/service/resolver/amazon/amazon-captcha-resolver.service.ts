import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { Cookies } from '../../../model/http/cookies';

export class AmazonCaptchaResolverService {
  private static readonly CAPTCHA_FORM_ID =
    'form[action="/errors/validateCaptcha"]';
  static readonly CAPTCHA_ERROR =
    'Amazon requested a captcha. Try again later or change locale (for example, amazon.co.uk instead of amazon.com).';

  checkCaptcha(
    url: URL,
    html: HTMLElement,
    cookies: Map<string, Cookies>
  ): void {
    const captchaForm: NullableHtmlElement = html.querySelector(
      AmazonCaptchaResolverService.CAPTCHA_FORM_ID
    );

    if (captchaForm != null) {
      const hostCookies: Cookies | undefined = cookies.get(url.hostname);
      console.error(
        url.hostname,
        hostCookies != undefined ? hostCookies.toString() : ''
      );
      throw AmazonCaptchaResolverService.CAPTCHA_ERROR;
    }
  }
}
