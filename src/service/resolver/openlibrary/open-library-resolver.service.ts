import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import { Message } from '../../../model/telegram/message';
import { HtmlUtil } from '../../../util/html-util';
import { AbstractResolver } from '../abstract-resolver';

export class OpenLibraryResolverService extends AbstractResolver {
  private static readonly TITLE_ID = '.work-title';
  private static readonly SUBTITLE_ID = '.work-subtitle';
  private static readonly AUTHOR_ID = '[itemprop="author"]';
  private static readonly PUBLISHER_ID = '[itemprop="publisher"]';
  private static readonly LANGUAGE_ID = '[itemprop="inLanguage"]';

  constructor() {
    super();
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const titleElement: NullableHtmlElement = html.querySelector(
        OpenLibraryResolverService.TITLE_ID
      );

      const subtitle: NullableHtmlElement = html.querySelector(
        OpenLibraryResolverService.SUBTITLE_ID
      );

      const author: NullableHtmlElement = html.querySelector(
        OpenLibraryResolverService.AUTHOR_ID
      );

      const publisher: NullableHtmlElement = html.querySelector(
        OpenLibraryResolverService.PUBLISHER_ID
      );

      const languageElement: NullableHtmlElement = html.querySelector(
        OpenLibraryResolverService.LANGUAGE_ID
      );

      this.checkRequiredElements([titleElement, author, publisher]);

      // prepare message
      const message: Message = new Message(SiteResolver.OPENBOOKS, url);

      // main info
      let title: string = HtmlUtil.getTextContent(titleElement as HTMLElement);
      if (subtitle != null) {
        title += ': ' + HtmlUtil.getTextContent(subtitle);
      }

      message.setTitle(title);
      message.setAuthor(HtmlUtil.getTextContent(author as HTMLElement));
      message.setPublisher(HtmlUtil.getTextContent(publisher as HTMLElement));

      // tags
      message.addTag('archive');

      if (languageElement != null) {
        let language: string = HtmlUtil.getTextContent(languageElement);
        language = language.trim().toLowerCase();

        if (this.isLanguageTagRequired(language)) {
          message.addTag(language);
        }
      }

      resolve([message]);
    });
  }
}
