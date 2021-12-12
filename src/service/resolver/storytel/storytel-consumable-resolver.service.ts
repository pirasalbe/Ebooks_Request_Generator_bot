import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import {
  StorytelItem,
  StorytelItemInformation,
} from '../../../model/resolver/storytel-item-information';
import { Format } from '../../../model/telegram/format.enum';
import { Message } from '../../../model/telegram/message';
import { Source } from '../../../model/telegram/source.enum';
import { StatisticsService } from '../../statistics/statistic.service';
import { AbstractResolver } from '../abstract-resolver';
import { StorytelApiResolverService } from './api/storytel-api-resolver.service';

export class StorytelConsumableResolverService extends AbstractResolver {
  private storytelInfoResolverService: StorytelApiResolverService;

  constructor(
    storytelInfoResolverService: StorytelApiResolverService,
    statisticsService: StatisticsService
  ) {
    super(statisticsService);
    this.storytelInfoResolverService = storytelInfoResolverService;
  }

  protected prepareUrl(url: URL): URL {
    return this.getStorytelHost(url);
  }

  protected getCookiesKey(url: URL): string {
    return this.getStorytelHost(url).toString();
  }

  private getStorytelHost(url: URL): URL {
    const path: string = url.pathname;
    let pathElements: string[] = path.split('/');

    if (pathElements.length > 3) {
      pathElements = pathElements.slice(0, 3);
      pathElements.push('');
    }

    const newUrl: URL = new URL(url.toString());
    newUrl.pathname = pathElements.join('/');

    return newUrl;
  }

  private getItemUrlId(url: URL): string {
    const paths: string[] = url.pathname.split('/');

    const itemUrl: string = paths[paths.length - 1];

    const elements: string[] = itemUrl.split('-');

    return elements[elements.length - 1];
  }

  extractMessages(url: URL): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      const consumableId: string = this.getItemUrlId(url);

      this.storytelInfoResolverService
        .getByConsumableId(
          consumableId,
          this.getCookies(this.getCookiesKey(url))
        )
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
