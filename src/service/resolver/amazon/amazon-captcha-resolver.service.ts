import { HTMLElement } from 'node-html-parser';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { Cookies } from '../../../model/http/cookies';

export class AmazonCaptchaResolverService {
  private static readonly CAPTCHA_FORM_ID =
    'form[action="/errors/validateCaptcha"]';

  checkCaptcha(html: HTMLElement, cookies: Map<string, Cookies>): void {
    const captchaForm: NullableHtmlElement = html.querySelector(
      AmazonCaptchaResolverService.CAPTCHA_FORM_ID
    );

    if (captchaForm != null) {
      console.error(cookies.toString());
      throw 'Amazon requested a captcha. Try again later or change locale (for example, amazon.co.uk instead of amazon.com).';
    }
  }
}
