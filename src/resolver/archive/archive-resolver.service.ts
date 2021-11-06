import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { AbstractResolver } from '../abstract-resolver';
import { Message } from '../message';
import { SiteResolver } from '../site-resolver.enum';
import { HtmlUtil } from './../html/html-util';
import { NullableHtmlElement } from './../html/nullable-html-element';
import { ArchiveInformation } from './archive-information';

export class ArchiveResolverService extends AbstractResolver {
  private static readonly CONTAINERS_ID = '.thats-left.item-details-metadata';

  private static readonly TITLE_ID = '.item-title';
  private static readonly AUTHOR_ID = 'a';

  private static readonly DETAILS_ID = 'dl.metadata-definition';
  private static readonly PUBLISHER_ID = 'span[itemprop="publisher"]';

  constructor() {
    super();
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const containers: HTMLElement[] = html.querySelectorAll(
        ArchiveResolverService.CONTAINERS_ID
      );

      this.checkRequiredElements(containers, 'Provided link is not of a book.');

      const information: ArchiveInformation =
        this.getArchiveInformation(containers);

      const author: NullableHtmlElement =
        information.header.element.querySelector(
          ArchiveResolverService.AUTHOR_ID
        );

      this.checkRequiredElements([author]);

      // prepare message
      const message: Message = new Message(SiteResolver.ARCHIVE, url);

      // main info
      message.setTitle(HtmlUtil.getTextContent(information.header.title));

      message.setAuthor(HtmlUtil.getTextContent(author as HTMLElement));

      // message.setPublisher(information.getPublisher());

      // tags
      message.addTag('archive');

      this.setDetails(message, information.body);

      resolve([message]);
    });
  }

  private getArchiveInformation(containers: HTMLElement[]): ArchiveInformation {
    if (containers.length != 2) {
      throw 'Something went wrong processing your link.';
    }

    const titleFromFirst: NullableHtmlElement = containers[0].querySelector(
      ArchiveResolverService.TITLE_ID
    );
    const titleFromSecond: NullableHtmlElement = containers[1].querySelector(
      ArchiveResolverService.TITLE_ID
    );

    let information: ArchiveInformation | null = null;
    if (titleFromFirst != null && titleFromSecond == null) {
      information = {
        header: {
          element: containers[0],
          title: titleFromFirst,
        },
        body: containers[1],
      };
    } else if (titleFromFirst == null && titleFromSecond != null) {
      information = {
        header: {
          element: containers[1],
          title: titleFromSecond,
        },
        body: containers[0],
      };
    } else {
      throw 'Cannot get book metadata correctly.';
    }

    return information;
  }

  private setDetails(message: Message, body: HTMLElement) {
    const publisher: NullableHtmlElement = body.querySelector(
      ArchiveResolverService.PUBLISHER_ID
    );

    if (publisher != null) {
      message.setPublisher(HtmlUtil.getTextContent(publisher));
    }

    // TODO cicle metadata
    // look for:
    // * publisher if it is null
    // * language
  }
}
