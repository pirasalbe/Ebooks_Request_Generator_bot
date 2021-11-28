import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';

export class AmazonCaptchaResolverService {
  private static readonly CAPTCHA_FORM_ID =
    'form[action="/errors/validateCaptcha"]';
  static readonly CAPTCHA_ERROR =
    'Amazon requested a captcha. Try again later or change locale (for example, amazon.co.uk instead of amazon.com).';

  checkCaptcha(url: URL, html: HTMLElement, cookies: string): void {
    const captchaForm: NullableHtmlElement = html.querySelector(
      AmazonCaptchaResolverService.CAPTCHA_FORM_ID
    );

    if (captchaForm != null) {
      console.error(url.hostname, cookies);
      throw AmazonCaptchaResolverService.CAPTCHA_ERROR;
    }
  }
}
