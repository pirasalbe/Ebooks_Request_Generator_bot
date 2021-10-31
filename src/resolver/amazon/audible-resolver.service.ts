import { HTMLElement } from 'node-html-parser';

import { I18nUtil } from '../../i18n/i18n-util';
import { LanguageStrings } from '../../i18n/language-strings';
import { AbstractResolver } from '../abstract-resolver';
import { Entry } from '../html/entry';
import { HtmlUtil } from '../html/html-util';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { Message } from '../message';

export class AudibleResolverService extends AbstractResolver {
  private static readonly HTML_ID = 'html';
  private static readonly MAIN_ID = '#center-1';
  private static readonly TITLE_ID = '.bc-heading.bc-size-title1.bc-text-bold';
  private static readonly AUTHOR_ID = '.authorLabel';

  constructor() {
    super();
  }

  resolve(url: string): Promise<string> {
    // override redirect
    if (url.includes('?')) {
      url += '&';
    } else {
      url += '?';
    }
    url += 'ipRedirectOverride=true';

    return super.resolve(url);
  }

  extractMessage(html: HTMLElement): Message {
    const htmlElement: NullableHtmlElement = html.querySelector(
      AudibleResolverService.HTML_ID
    );

    const nullableMainDiv: NullableHtmlElement = html.querySelector(
      AudibleResolverService.MAIN_ID
    );

    this.checkRequiredElements(
      [htmlElement, nullableMainDiv],
      'Missing main elements.'
    );

    const language: string = (htmlElement as HTMLElement).attributes.lang;

    const mainDiv: HTMLElement = nullableMainDiv as HTMLElement;

    const title: NullableHtmlElement = mainDiv.querySelector(
      AudibleResolverService.TITLE_ID
    );

    const author: NullableHtmlElement = this.getAuthorElement(html);

    this.checkRequiredElements([title, author]);

    // prepare message
    const message: Message = new Message();

    // main info
    message.setTitle(HtmlUtil.getTextContent(title as HTMLElement));
    message.setAuthor(HtmlUtil.getTextContent(author as HTMLElement));

    // TODO publisher

    // tags
    message.addTag(Message.AUDIOBOOK_TAG);

    if (this.isLanguageTagRequired(I18nUtil.getLanguageFromCode(language))) {
      message.addTag(language);
    }

    return message;
  }

  private getAuthorElement(html: HTMLElement): NullableHtmlElement {
    let author: NullableHtmlElement = null;

    const authorLabel: NullableHtmlElement = html.querySelector(
      AudibleResolverService.AUTHOR_ID
    );

    if (authorLabel != null) {
      author = authorLabel.querySelector('.bc-link');
    }

    return author;
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
      .replace(':', '');
  }
}
