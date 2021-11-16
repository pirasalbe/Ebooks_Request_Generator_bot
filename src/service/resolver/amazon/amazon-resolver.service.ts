import * as http from 'http';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { Entry } from '../../../model/entry';
import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { LanguageStrings } from '../../../model/i18n/language-strings';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import { Message } from '../../../model/telegram/message';
import { HtmlUtil } from '../../../util/html-util';
import { I18nUtil } from '../../../util/i18n-util';
import { AbstractResolver } from '../abstract-resolver';
import { ResolverException } from './../../../model/error/resolver-exception';
import { AmazonCaptchaResolverService } from './amazon-captcha-resolver.service';
import { AmazonDetails } from './amazon-details';
import { AmazonFormatResolverService } from './amazon-format-resolver.service';

export class AmazonResolverService extends AbstractResolver {
  private static readonly LANGUAGE_PATH_PARAM: RegExp = /^\/-\/[a-zA-Z]{2}\//g;

  private static readonly SITE_LANGUAGE_ID = 'script[type="text/javascript"]';
  private static readonly SITE_LANGUAGE_PROPERTY =
    "window.$Nav && $Nav.declare('config.languageCode','";

  private static readonly TITLE_ID = '#productTitle';
  private static readonly AUTHOR_ID = '.contributorNameID';
  private static readonly AUTHOR_ALTERNATIVE_ID = '.author';
  private static readonly KINDLE_FORMAT_ID = '#productSubtitle';

  private static readonly DETAILS_LIST_ID = '.detail-bullet-list';
  private static readonly DETAILS_CAROUSEL_ID =
    '.a-carousel-card.rpi-carousel-attribute-card';
  private static readonly SPAN = 'span';

  private static readonly LINK_CLASS = '.a-link-normal';

  private static readonly KINDLE = 'kindle';

  private static readonly URL_PREFIX = '/dp/';
  private static readonly AMAZON_HOSTS: string[] = [
    'www.amazon.com',
    'www.amazon.co.uk',
    'www.amazon.ca',
    'www.amazon.com.au',
    'www.amazon.it',
    'www.amazon.de',
    'www.amazon.es',
    'www.amazon.fr',
  ];

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

  /**
   * Override processSuccessfulResponse
   * Manage the captcha exceptions to redirect to another host
   *
   * @param url Original url
   * @param response Original response
   */
  protected processSuccessfulResponse(
    url: URL,
    response: http.IncomingMessage
  ): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) =>
      super
        .processSuccessfulResponse(url, response)
        .then((messages: Message[]) => resolve(messages))
        .catch((error: ResolverException) => {
          // when there are errors related to the captcha reroute
          if (error.message == AmazonCaptchaResolverService.CAPTCHA_ERROR) {
            this.resolve(this.changeHost(url))
              .then((messages: Message[]) => resolve(messages))
              .catch((newError) => reject(newError));
          } else {
            // reject as always
            reject(error);
          }
        })
    );
  }

  /**
   * Override processResponse
   * Manage the 503 exception
   *
   * @param url Original url
   * @param response Original response
   */
  protected processResponse(
    url: URL,
    response: http.IncomingMessage
  ): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) =>
      super
        .processResponse(url, response)
        .then((messages: Message[]) => resolve(messages))
        .catch((error: string) => {
          // when there are errors related to the 503 error
          if (error.includes('503')) {
            this.resolve(this.changeHost(url))
              .then((messages: Message[]) => resolve(messages))
              .catch((newError) => reject(newError));
          } else {
            // reject as always
            reject(error);
          }
        })
    );
  }

  private changeHost(url: URL): URL {
    const currentHost: string = url.host;

    const alternativeHosts: string[] = [];
    for (const host of AmazonResolverService.AMAZON_HOSTS) {
      if (host != currentHost) {
        alternativeHosts.push(host);
      }
    }

    const random: number = Math.floor(Math.random() * alternativeHosts.length);

    const newUrl: URL = new URL(url.toString());
    newUrl.host = alternativeHosts[random];

    console.debug('Rerouting', url, newUrl);

    return newUrl;
  }

  prepareUrl(url: URL): URL {
    // remove language from path
    while (
      url.pathname.match(AmazonResolverService.LANGUAGE_PATH_PARAM) != null
    ) {
      url.pathname = url.pathname.replace(
        AmazonResolverService.LANGUAGE_PATH_PARAM,
        '/'
      );
    }

    url.search = '';

    return url;
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      // captcha
      this.amazonCaptchaResolverService.checkCaptcha(url, html, this.cookies);

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

      const nullableDetailsList: NullableHtmlElement = html.querySelector(
        AmazonResolverService.DETAILS_LIST_ID
      );

      this.checkRequiredElements([title, author, nullableDetailsList]);

      // details
      const detailsList: NullableHtmlElement =
        nullableDetailsList as HTMLElement;

      const detailsCarousel: HTMLElement[] = html.querySelectorAll(
        AmazonResolverService.DETAILS_CAROUSEL_ID
      );

      const detailsItems: HTMLElement[] =
        detailsList.getElementsByTagName('li');

      const amazonDetails: AmazonDetails = new AmazonDetails();

      // read the list
      this.getDetails(
        amazonDetails,
        siteLanguage,
        detailsItems,
        (element: HTMLElement) => this.getEntryFromListItem(element)
      );

      // read the carousel
      this.getDetails(
        amazonDetails,
        siteLanguage,
        detailsCarousel,
        (element: HTMLElement) => this.getEntryFromCarouselItem(element)
      );

      // prepare message
      const message: Message = new Message(SiteResolver.AMAZON, url);

      // main info
      message.setTitle(HtmlUtil.getTextContent(title as HTMLElement));
      message.setAuthor(HtmlUtil.getTextContent(author as HTMLElement));

      this.setPublicationDate(
        message,
        siteLanguage,
        amazonDetails.getPublicationDate(),
        amazonDetails.getPublisher()
      );

      this.setPublisher(message, amazonDetails.getPublisher());

      // tags
      if (amazonDetails.hasLanguage()) {
        this.addLanguageTag(
          message,
          siteLanguage,
          amazonDetails.getLanguage() as string
        );
      }

      const asin: string = this.getAsin(url, amazonDetails.getAsin());
      message.setUrl(this.getAmazonAsinUrl(url, asin));

      this.addKindleUnlimitedTag(url, message, asin, html)
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
    if (format == null || format.textContent == null) {
      throw 'Cannot find product information.';
    }

    if (
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

  private getAsin(url: URL, asin: string | null): string {
    let result: string | null = null;

    const path: string = url.pathname;

    const index: number = path.indexOf(AmazonResolverService.URL_PREFIX);
    if (index > -1) {
      result = path.substr(index + AmazonResolverService.URL_PREFIX.length, 10);
    } else if (asin != null) {
      result = asin;
    } else {
      throw 'Cannot parse the url properly.';
    }

    return result;
  }

  private addKindleUnlimitedTag(
    url: URL,
    message: Message,
    asin: string,
    html: HTMLElement
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.amazonFormatResolverService
        .isKindleUnlimited(url, asin, html)
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

  /**
   * Find the details of a book
   * @param amazonDetails Existing details
   * @param siteLanguage Language to parse the text
   * @param details List of details elements
   * @param getEntry Function to extract the key and value
   * @returns AmazonDetails
   */
  private getDetails(
    amazonDetails: AmazonDetails,
    siteLanguage: string,
    details: HTMLElement[],
    getEntry: (element: HTMLElement) => Entry<string, string>
  ): void {
    for (let i = 0; i < details.length && !amazonDetails.isComplete(); i++) {
      const element = details[i];
      const entry: Entry<string, string> = getEntry(element);
      const key: string | null = I18nUtil.getKey(siteLanguage, entry.getKey());

      if (key != null) {
        switch (key) {
          case LanguageStrings.LANGUAGE_KEY:
            amazonDetails.setLanguage(entry.getValue());
            break;
          case LanguageStrings.PUBLISHER_KEY:
            amazonDetails.setPublisher(entry.getValue());
            break;
          case LanguageStrings.PUBLICATION_DATE_KEY:
            amazonDetails.setPublicationDate(entry.getValue());
            break;
          case LanguageStrings.ASIN_KEY:
            amazonDetails.setAsin(entry.getValue());
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
   * @param item A detail element
   */
  private getEntryFromListItem(item: HTMLElement): Entry<string, string> {
    const parentSpan: NullableHtmlElement = item.querySelector('.a-list-item');
    let entry: Entry<string, string>;

    if (parentSpan != null) {
      const spans: HTMLElement[] = parentSpan.getElementsByTagName(
        AmazonResolverService.SPAN
      );

      // span with info
      if (spans.length == 2) {
        const key = this.sanitizeKey(spans[0]);
        const value = HtmlUtil.getTextContent(spans[1]);
        entry = new Entry<string, string>(key, value);
      } else {
        console.error(parentSpan.childNodes, spans);
        throw 'Error parsing page. Cannot read product detail information from list.';
      }
    } else {
      console.error(item.childNodes, parentSpan);
      throw 'Error parsing page. Cannot read a product detail from list.';
    }

    return entry;
  }

  /**
   * Extract detail information from the following html structure
   *
   * <div>
   *   <div class="a-section a-spacing-small a-text-center rpi-attribute-label">
   *     <span>Language</span>
   *   </div>
   *   <div class="a-section a-spacing-small a-text-center">
   *     <span class="rpi-icon language"></span>
   *   </div>
   *   <div class="a-section a-spacing-none a-text-center rpi-attribute-value">
   *     <span>English</span>
   *   </div>
   * </div>
   *
   * @param item A detail element
   */
  private getEntryFromCarouselItem(item: HTMLElement): Entry<string, string> {
    const keyElement: NullableHtmlElement = item.querySelector(
      '.rpi-attribute-label'
    );
    const valueElement: NullableHtmlElement = item.querySelector(
      '.rpi-attribute-value'
    );

    let key = '';
    let value = '';

    if (keyElement != null && valueElement != null) {
      key = HtmlUtil.getRawText(this.getSpan(keyElement));
      value = HtmlUtil.getTextContent(this.getSpan(valueElement));
    }

    return new Entry<string, string>(key, value);
  }

  private getSpan(element: HTMLElement): HTMLElement {
    const spans: HTMLElement[] = element.getElementsByTagName(
      AmazonResolverService.SPAN
    );

    if (spans.length < 1) {
      console.error(element, spans);
      throw 'Error parsing page. Cannot read product detail information from carousel.';
    }

    return spans[0];
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
    newUrl.search = '';
    return newUrl;
  }

  private setPublicationDate(
    message: Message,
    siteLanguage: string,
    publicationDate: string | null,
    publisher: string | null
  ): void {
    let dateString: string | null = null;

    // get the date
    if (publicationDate != null) {
      dateString = publicationDate;
    } else if (publisher != null) {
      const startIndex: number = publisher.indexOf('(');
      const endIndex: number = publisher.indexOf(
        ')',
        startIndex > -1 ? startIndex : 0
      );
      if (startIndex > -1 && endIndex > -1) {
        dateString = publisher.substring(startIndex, endIndex);
      }
    }

    // transform date
    if (dateString != null) {
      const dateParts: string[] = dateString.split(' ');

      let days: number | null = null;
      let month: string | null = null;
      let year: number | null = null;

      // parse date
      for (const datePart of dateParts) {
        const part: string = datePart
          .replace('.', '')
          .replace(',', '')
          .toLowerCase()
          .trim();

        if (part.match(/^[0-9]{1,2}$/g)) {
          // days
          days = Number(part);
        } else if (part.match(/^[0-9]{4}$/g)) {
          // year
          year = Number(part);
        } else if (part.match(/[a-z]*/g)) {
          // month
          month = I18nUtil.getKey(siteLanguage, part);
        }
      }

      // transform to date object
      if (days != null && month != null && year != null) {
        const date: Date = new Date();
        date.setFullYear(year, Number(month), days);
        date.setUTCHours(0, 0, 0, 0);
        message.setPublicationDate(date);
      }
    }
  }

  private setPublisher(message: Message, publisher: string | null): void {
    if (publisher != null) {
      const index: number = publisher.indexOf('(');
      if (index > -1) {
        message.setPublisher(publisher.substring(0, index).trim());
      } else {
        message.setPublisher(publisher);
      }
    }
  }
}
