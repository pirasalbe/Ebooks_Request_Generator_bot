import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';
import { Message } from '../message';
import { SiteResolver } from '../site-resolver.enum';

export class ArchiveResolverService extends AbstractResolver {
  private static readonly CONTAINERS_ID = '.thats-left.item-details-metadata';
  private static readonly TITLE_ID = '.item-title';
  private static readonly AUTHOR_ID = 'a';
  private static readonly DETAILS_ID = 'dl.metadata-definition';

  constructor() {
    super();
  }

  extractMessage(html: HTMLElement): Promise<Message> {
    return new Promise<Message>((resolve) => {
      const containers: HTMLElement[] = html.querySelectorAll(
        ArchiveResolverService.CONTAINERS_ID
      );

      this.checkRequiredElements(containers, 'Cannot get information.');

      // TODO there are 2 containers:
      // 1- title TITLE_ID and author AUTHOR_ID
      // 2- details (list of DETAILS_ID)

      // prepare message
      const message: Message = new Message(SiteResolver.ARCHIVE);

      // main info
      // message.setTitle(information.getTitle());

      // message.setAuthor(information.getAuthor());

      // message.setPublisher(information.getPublisher());

      // tags
      message.addTag('archive');
      // if (this.isAudiobook(bookIcon, audiobookIcon)) {
      //   message.addTag(Message.AUDIOBOOK_TAG);
      // }

      // const language: string = information.getLanguage();
      // if (this.isLanguageTagRequired(language)) {
      //   message.addTag(language);
      // }

      resolve(message);
    });
  }
}
