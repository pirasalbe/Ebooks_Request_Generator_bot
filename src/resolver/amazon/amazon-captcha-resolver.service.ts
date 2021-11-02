import * as CaptchaSolver from 'captcha-solver';

export class AmazonCaptchaResolverService {
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';

  private solveCaptcha(): void {
    const solver = new CaptchaSolver('browser');
    const codes = solver.solve();
  }
}
