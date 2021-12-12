import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import { Format } from '../../../model/telegram/format.enum';
import { Message } from '../../../model/telegram/message';
import { Source } from '../../../model/telegram/source.enum';
import { StatisticsService } from '../../statistics/statistic.service';
import { AbstractResolver } from '../abstract-resolver';
import {
  StorytelItem,
  StorytelItemInformation,
} from './../../../model/resolver/storytel-item-information';
import { StorytelApiResolverService } from './api/storytel-api-resolver.service';

export class StorytelSearchResolverService extends AbstractResolver {
  private static readonly SEARCH_URL = 'https://www.storytel.com/in/en/search-';

  private static readonly BOOK_ELEMENT = 'a';
  private static readonly HREF = 'href';
  private static readonly HREF_START_VALUE = '/in/en/books/';

  private static readonly BOOK_ID_ATTRIBUTE = 'bookid';

  private storytelInfoResolverService: StorytelApiResolverService;

  constructor(
    storytelInfoResolverService: StorytelApiResolverService,
    statisticsService: StatisticsService
  ) {
    super(statisticsService);
    this.storytelInfoResolverService = storytelInfoResolverService;
  }

  prepareUrl(url: URL): URL {
    const newLink: string =
      StorytelSearchResolverService.SEARCH_URL + this.getItemUrlId(url);

    return new URL(newLink);
  }

  private getItemUrlId(url: URL): string {
    const paths: string[] = url.pathname.split('/');

    const itemUrl: string = paths[paths.length - 1];

    const elements: string[] = itemUrl.split('-');

    return elements[elements.length - 1];
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      const linkButtonNullable: NullableHtmlElement = this.getLinkButton(
        url,
        html
      );

      this.checkRequiredElements([linkButtonNullable], 'Book not found.');

      const linkButton: HTMLElement = linkButtonNullable as HTMLElement;
      const parentDiv: HTMLElement = linkButton.parentNode.parentNode;

      if (
        !parentDiv.hasAttribute(StorytelSearchResolverService.BOOK_ID_ATTRIBUTE)
      ) {
        throw 'Unexpected format.';
      }

      const bookId: string = parentDiv.getAttribute(
        StorytelSearchResolverService.BOOK_ID_ATTRIBUTE
      ) as string;

      this.storytelInfoResolverService
        .getByBookId(bookId, this.getCookies(this.getCookiesKey(url)))
        .then((information: StorytelItemInformation) => {
          // prepare message
          const message: Message = new Message(SiteResolver.STORYTEL, url);

          // main info
          message.setTitle(information.slb.book.name);

          for (const author of information.slb.book.authors) {
            message.addAuthor(author.name);
          }

          // tags
          message.setSource(Source.STORYTEL);

          const language: string =
            information.slb.book.language.name.toLowerCase();
          if (this.isLanguageTagRequired(language)) {
            message.setLanguage(language as string);
          }

          const messages: Message[] = [];

          if (
            information.slb.ebook != undefined &&
            information.slb.ebook != null
          ) {
            const ebookMessage: Message = message.clone();
            this.setPublisherAndPublicationDate(
              ebookMessage,
              information.slb.ebook
            );
            messages.push(ebookMessage);
          }

          if (
            information.slb.abook != undefined &&
            information.slb.abook != null
          ) {
            const audiobookMessage: Message = message.clone();
            audiobookMessage.setFormat(Format.AUDIOBOOK);
            this.setPublisherAndPublicationDate(
              audiobookMessage,
              information.slb.abook
            );
            messages.push(audiobookMessage);
          }

          resolve(messages);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private getLinkButton(url: URL, html: HTMLElement): NullableHtmlElement {
    let linkButton: NullableHtmlElement = null;

    const itemUrlId: string = this.getItemUrlId(url);

    const linkButtons: HTMLElement[] = html.querySelectorAll(
      StorytelSearchResolverService.BOOK_ELEMENT
    );

    for (let i = 0; i < linkButtons.length && linkButton == null; i++) {
      const linkElement: HTMLElement = linkButtons[i];
      if (linkElement.hasAttribute(StorytelSearchResolverService.HREF)) {
        const link: string = linkElement.getAttribute(
          StorytelSearchResolverService.HREF
        ) as string;

        if (
          link.startsWith(StorytelSearchResolverService.HREF_START_VALUE) &&
          link.endsWith(itemUrlId)
        ) {
          linkButton = linkElement;
        }
      }
    }

    return linkButton;
  }

  private setPublisherAndPublicationDate(
    message: Message,
    item: StorytelItem
  ): void {
    message.setPublisher(item.publisher.name);
    message.setPublicationDate(new Date(item.releaseDateFormat));
  }
}
