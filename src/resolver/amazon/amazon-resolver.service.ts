import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { LanguageStrings } from '../../i18n/language-strings';
import { AbstractResolver } from '../abstract-resolver';
import { HtmlUtil } from '../html/html-util';
import { I18nUtil } from './../../i18n/i18n-util';
import { Entry } from './../html/entry';
import { NullableHtmlElement } from './../html/nullable-html-element';
import { Message } from './../message';
import { SiteResolver } from './../site-resolver.enum';
import { AmazonCaptchaResolverService } from './amazon-captcha-resolver.service';
import { AmazonFormatResolverService } from './amazon-format-resolver.service';

export class AmazonResolverService extends AbstractResolver {
  private static readonly SITE_LANGUAGE_ID = 'script[type="text/javascript"]';
  private static readonly SITE_LANGUAGE_PROPERTY =
    "window.$Nav && $Nav.declare('config.languageCode','";

  private static readonly TITLE_ID = '#productTitle';
  private static readonly AUTHOR_ID = '.contributorNameID';
  private static readonly AUTHOR_ALTERNATIVE_ID = '.author';
  private static readonly KINDLE_FORMAT_ID = '#productSubtitle';
  private static readonly DETAILS_ID = '.detail-bullet-list';

  private static readonly LINK_CLASS = '.a-link-normal';

  private static readonly KINDLE = 'kindle';

  private static readonly URL_PREFIX = '/dp/';

  private amazonFormatResolverService: AmazonFormatResolverService;
  private amazonCaptchaResolverService: AmazonCaptchaResolverService;

  constructor(
    amazonFormatResolverService: AmazonFormatResolverService,
    amazonCaptchaResolverService: AmazonCaptchaResolverService
  ) {
    super();
    this.amazonFormatResolverService = amazonFormatResolverService;
    this.amazonCaptchaResolverService = amazonCaptchaResolverService;
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      // captcha
      this.amazonCaptchaResolverService.checkCaptcha(html, this.cookiesHeaders);

      // checks
      const kindleFormat: NullableHtmlElement = html.querySelector(
        AmazonResolverService.KINDLE_FORMAT_ID
      );

      this.checkKindleFormat(kindleFormat);

      const siteLanguageElements: HTMLElement[] = html.querySelectorAll(
        AmazonResolverService.SITE_LANGUAGE_ID
      );

      const siteLanguage: string = this.getSiteLanguage(siteLanguageElements);

      const title: NullableHtmlElement = html.querySelector(
        AmazonResolverService.TITLE_ID
      );

      const author: NullableHtmlElement = this.getAuthorElement(html);

      const details: NullableHtmlElement = html.querySelector(
        AmazonResolverService.DETAILS_ID
      );

      this.checkRequiredElements([title, author, details]);

      // prepare message
      const message: Message = new Message(SiteResolver.AMAZON, url);

      // main info
      message.setTitle(HtmlUtil.getTextContent(title as HTMLElement));
      message.setAuthor(HtmlUtil.getTextContent(author as HTMLElement));
      this.setDetails(message, siteLanguage, details as HTMLElement);

      // tags
      const asin: string = this.getAsin(url);
      message.setUrl(this.getAmazonAsinUrl(url, asin));

      this.addKindleUnlimitedTag(message, asin, html)
        .then(() => resolve([message]))
        .catch(() => resolve([message]));
    });
  }

  private getSiteLanguage(siteLanguageElements: HTMLElement[]): string {
    let languageText = '';
    let index = -1;

    for (let i = 0; i < siteLanguageElements.length && index < 0; i++) {
      languageText = HtmlUtil.getRawText(siteLanguageElements[i]);

      index = languageText.indexOf(
        AmazonResolverService.SITE_LANGUAGE_PROPERTY
      );
    }

    if (index < 0) {
      throw 'Cannot get site language.';
    }

    return languageText.substr(
      index + AmazonResolverService.SITE_LANGUAGE_PROPERTY.length,
      2
    );
  }

  private checkKindleFormat(format: NullableHtmlElement): void {
    if (
      format == null ||
      format.textContent == null ||
      !format.textContent
        .toLocaleLowerCase()
        .includes(AmazonResolverService.KINDLE)
    ) {
      throw 'Provided link is not of a Kindle Edition. Make sure to copy the kindle edition link from amazon.';
    }
  }

  private getAuthorElement(html: HTMLElement): NullableHtmlElement {
    let author: NullableHtmlElement = html.querySelector(
      AmazonResolverService.AUTHOR_ID
    );

    if (author == null) {
      const authorWrapper: NullableHtmlElement = html.querySelector(
        AmazonResolverService.AUTHOR_ALTERNATIVE_ID
      );

      if (authorWrapper != null) {
        author = authorWrapper.querySelector(AmazonResolverService.LINK_CLASS);
      }
    }

    return author;
  }

  private getAsin(url: URL): string {
    const path: string = url.pathname;

    const index: number = path.indexOf(AmazonResolverService.URL_PREFIX);
    if (index < 0) {
      throw 'Cannot parse the url properly.';
    }

    return path.substr(index + AmazonResolverService.URL_PREFIX.length, 10);
  }

  private addKindleUnlimitedTag(
    message: Message,
    asin: string,
    html: HTMLElement
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.amazonFormatResolverService
        .isKindleUnlimited(asin, html)
        .then((exists: boolean) => {
          if (exists) {
            message.addTag('KU');
          }
          resolve();
        })
        .catch((error) => {
          console.error('Error retrieving book formats.', error);
          reject();
        });
    });
  }

  private setDetails(
    message: Message,
    siteLanguage: string,
    details: HTMLElement
  ): void {
    const li: HTMLElement[] = details.getElementsByTagName('li');

    let laungage = false;
    let publisher = false;

    for (let i = 0; i < li.length && (!laungage || !publisher); i++) {
      const element = li[i];
      const entry: Entry<string, string> = this.getDetailElement(element);
      const key: string | null = I18nUtil.getKey(siteLanguage, entry.getKey());

      if (key != null) {
        switch (key) {
          case LanguageStrings.LANGUAGE_KEY:
            laungage = true;
            this.addLanguageTag(message, siteLanguage, entry.getValue());
            break;
          case LanguageStrings.PUBLISHER_KEY:
            publisher = true;
            message.setPublisher(entry.getValue());
            break;
          default:
            break;
        }
      }
    }
  }

  /**
   * Extract detail information from the following html structure
   *
   * <li>
   *    <span class="a-list-item">
   *       <span class="a-text-bold">Publisher &rlm; : &lrm;</span>
   *       <span>Penguin (16 Sept. 2021)</span>
   *    </span>
   * </li>
   *
   * @param li A detail element
   */
  private getDetailElement(li: HTMLElement): Entry<string, string> {
    const parentSpan: NullableHtmlElement = li.querySelector('.a-list-item');
    let entry: Entry<string, string>;

    if (parentSpan != null) {
      const spans: HTMLElement[] = parentSpan.getElementsByTagName('span');

      // span with info
      if (spans.length == 2) {
        const key = this.sanitizeKey(spans[0]);
        const value = HtmlUtil.getTextContent(spans[1]);
        entry = new Entry<string, string>(key, value);
      } else {
        console.error(parentSpan.childNodes, spans);
        throw 'Error parsing page. Cannot read product detail information.';
      }
    } else {
      console.error(li.childNodes, parentSpan);
      throw 'Error parsing page. Cannot read a product detail.';
    }

    return entry;
  }

  private sanitizeKey(key: HTMLElement): string {
    return HtmlUtil.getRawText(key)
      .replaceAll('\n', '')
      .replace('&rlm;', '')
      .replace('&lrm;', '')
      .replace(':', '')
      .trim();
  }

  private addLanguageTag(
    message: Message,
    siteLanguage: string,
    language: string
  ): void {
    const languageLowerCase: string | null = I18nUtil.getKey(
      siteLanguage,
      language
    );

    if (!this.isLanguageDefined(languageLowerCase)) {
      // add language when it cannot be translated
      message.addTag(language.toLowerCase());
    } else if (this.isLanguageTagRequired(languageLowerCase)) {
      // add language if it is not english
      message.addTag(languageLowerCase as string);
    }
  }

  private getAmazonAsinUrl(url: URL, asin: string): URL {
    const newUrl: URL = new URL(url.toString());
    newUrl.pathname = AmazonResolverService.URL_PREFIX + asin;
    return newUrl;
  }
}
