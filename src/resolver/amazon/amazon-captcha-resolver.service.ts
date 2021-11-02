import { HTMLElement } from 'node-html-parser';

export class AmazonCaptchaResolverService {
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';

  checkCaptcha(html: HTMLElement): boolean {
    return false;
  }
}
