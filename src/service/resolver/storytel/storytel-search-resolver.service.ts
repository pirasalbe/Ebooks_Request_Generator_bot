import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import { Format } from '../../../model/telegram/format.enum';
import { Message } from '../../../model/telegram/message';
import { Source } from '../../../model/telegram/source.enum';
import { HtmlUtil } from '../../../util/html-util';
import { StatisticsService } from '../../statistics/statistic.service';
import { AbstractResolver } from '../abstract-resolver';
import { StorytelItem, StorytelItemInformation } from './../../../model/resolver/storytel-item-information';
import { StorytelInfoResolverService } from './storytel-info-resolver.service';

export class StorytelSearchResolverService extends AbstractResolver {
  private static readonly SEARCH_URL = 'https://www.storytel.com/it/it/cerca-';

  private static readonly TITLE_WRAP_ID = '.titleWrapp';

  private static readonly PLACEHOLDER = 'placeholder';
  private static readonly BOOK_ELEMENT =
    'a[href="/it/it/books/' + StorytelSearchResolverService.PLACEHOLDER + '"]';

  private static readonly BOOK_ID_ATTRIBUTE = 'bookid';

  private storytelInfoResolverService: StorytelInfoResolverService;

  constructor(
    storytelInfoResolverService: StorytelInfoResolverService,
    statisticsService: StatisticsService
  ) {
    super(statisticsService);
    this.storytelInfoResolverService = storytelInfoResolverService;
  }

  prepareUrl(url: URL): URL {
    const newLink: string =
      StorytelSearchResolverService.SEARCH_URL + this.getLastPathElement(url);

    return new URL(newLink);
  }

  private getLastPathElement(url: URL): string {
    const paths: string[] = url.pathname.split('/');

    return paths[paths.length - 1];
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      const bookUrl: NullableHtmlElement = html.querySelector(
        StorytelSearchResolverService.TITLE_WRAP_ID
      );

      this.checkRequiredElements(
        [bookUrl],
        'There was an error resolving book url.'
      );

      const linkId: string = StorytelSearchResolverService.BOOK_ELEMENT.replace(
        StorytelSearchResolverService.PLACEHOLDER,
        HtmlUtil.getTextContent(bookUrl as HTMLElement)
      );

      const linkButtonNullable: NullableHtmlElement =
        html.querySelector(linkId);

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
        .getInfo(bookId, this.getCookies(url.hostname))
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

  private setPublisherAndPublicationDate(
    message: Message,
    item: StorytelItem
  ): void {
    message.setPublisher(item.publisher.name);
    message.setPublicationDate(new Date(item.releaseDateFormat));
  }
}
