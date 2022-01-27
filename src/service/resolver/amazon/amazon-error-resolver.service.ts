import { HTMLElement } from 'node-html-parser';
import html from 'node-html-parser/dist/nodes/html';
import { url } from 'telegraf/typings/button';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { HtmlUtil } from './../../../util/html-util';

export class AmazonErrorResolverService {
  private static readonly CAPTCHA_FORM_ID =
    'form[action="/errors/validateCaptcha"]';
  static readonly CAPTCHA_ERROR =
    'Amazon requested a captcha. Try again later or change locale (for example, amazon.co.uk instead of amazon.com).';

  private static readonly ALERT_CONTENT_ID = '.a-alert-content';
  static readonly RELOAD_ERROR =
    'Amazon requested a captcha. Try again later or change locale (for example, amazon.co.uk instead of amazon.com).';

  checkErrors(url: URL, html: HTMLElement, cookies: string): void {
    this.checkCaptcha(url, html, cookies);

    this.checkAlert(url, html, cookies);
  }

  private throwError(reason: string, url: URL, cookies: string): void {
    console.error(reason, url.hostname, cookies);
    throw reason;
  }

  private checkCaptcha(url: URL, html: HTMLElement, cookies: string): void {
    const captchaForm: NullableHtmlElement = html.querySelector(
      AmazonErrorResolverService.CAPTCHA_FORM_ID
    );

    if (captchaForm != null) {
      this.throwError(AmazonErrorResolverService.CAPTCHA_ERROR, url, cookies);
    }
  }

  private checkAlert(url: URL, html: HTMLElement, cookies: string): void {
    const alertDivs: HTMLElement[] = html.querySelectorAll(
      AmazonErrorResolverService.ALERT_CONTENT_ID
    );

    for (const div of alertDivs) {
      if (
        HtmlUtil.getTextContent(div) == AmazonErrorResolverService.RELOAD_ERROR
      ) {
        this.throwError(AmazonErrorResolverService.RELOAD_ERROR, url, cookies);
      }
    }
  }
}
