import { HTMLElement } from 'node-html-parser';

import { LanguageStrings } from '../../i18n/language-strings';
import { AbstractResolver } from '../abstract-resolver';
import { HtmlUtil } from '../html/html-util';
import { I18nUtil } from './../../i18n/i18n-util';
import { Entry } from './../html/entry';
import { Message } from './../message';

export class AmazonResolverService extends AbstractResolver {
  private static readonly SITE_LANGUAGE_ID = '.nav-logo-locale';
  private static readonly TITLE_ID = '#productTitle';
  private static readonly AUTHOR_ID = '.contributorNameID';
  private static readonly KINDLE_FORMAT_ID = '#productSubtitle';
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';
  private static readonly DETAILS_ID = '.detail-bullet-list';

  private static readonly KINDLE = 'kindle';

  extractMessage(html: HTMLElement): Message {
    // checks
    const kindleFormat: HTMLElement | null = html.querySelector(
      AmazonResolverService.KINDLE_FORMAT_ID
    );

    this.checkKindleFormat(kindleFormat);

    const siteLanguage: HTMLElement | null = html.querySelector(
      AmazonResolverService.SITE_LANGUAGE_ID
    );

    const title: HTMLElement | null = html.querySelector(
      AmazonResolverService.TITLE_ID
    );

    const author: HTMLElement | null = html.querySelector(
      AmazonResolverService.AUTHOR_ID
    );

    const details: HTMLElement | null = html.querySelector(
      AmazonResolverService.DETAILS_ID
    );

    this.checkRequiredElements([siteLanguage, title, author, details]);

    // prepare message
    const message: Message = new Message();

    // main info
    message.setTitle(HtmlUtil.getTextContent(title as HTMLElement));
    message.setAuthor(HtmlUtil.getTextContent(author as HTMLElement));
    this.setDetails(
      message,
      HtmlUtil.getRawText(siteLanguage as HTMLElement),
      details as HTMLElement
    );

    // tags
    this.addTags(message, html);

    return message;
  }

  private checkKindleFormat(format: HTMLElement | null): void {
    if (
      format == null ||
      format.textContent == null ||
      !format.textContent
        .toLocaleLowerCase()
        .includes(AmazonResolverService.KINDLE)
    ) {
      throw 'The product is not a kindle book';
    }
  }

  private checkRequiredElements(elements: (HTMLElement | null)[]): void {
    const indexNullElement = elements.findIndex((e) => e == null);
    if (indexNullElement >= 0) {
      console.error(indexNullElement);
      throw 'Error parsing page. Missing required elements.';
    }
  }

  private addTags(message: Message, html: HTMLElement): void {
    const kindleUnlimited: HTMLElement | null = html.querySelector(
      AmazonResolverService.KINDLE_UNLIMITED_ID
    );

    if (kindleUnlimited != null) {
      message.addTag('KU');
    }
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
    const parentSpan: HTMLElement | null = li.querySelector('.a-list-item');
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
      .replace(':', '');
  }
}
