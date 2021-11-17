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
import { StatisticsService } from './../../statistics/statistic.service';
import { ArchiveInformation } from './archive-information';

export class ArchiveResolverService extends AbstractResolver {
  private static readonly SITE_LANGUAGE = 'en';

  private static readonly FORMAT_ID = '[itemtype="http://schema.org/Book"]';

  private static readonly CONTAINERS_ID = '.thats-left.item-details-metadata';

  private static readonly TITLE_ID = '.item-title';
  private static readonly AUTHOR_ID = 'a';

  private static readonly DETAILS_ID = 'dl.metadata-definition';
  private static readonly PUBLISHER_ID = 'span[itemprop="publisher"]';

  constructor(statisticsService: StatisticsService) {
    super(statisticsService);
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const format: NullableHtmlElement = html.querySelector(
        ArchiveResolverService.FORMAT_ID
      );

      if (format == null) {
        throw 'Provided link is not of an ebook.';
      }

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

      // prepare message
      const message: Message = new Message(SiteResolver.ARCHIVE, url);

      // main info
      message.setTitle(HtmlUtil.getTextContent(information.header.title));

      // tags
      message.addTag('archive');

      this.setDetails(message, author, information.body);

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

  private setDetails(
    message: Message,
    authorElement: NullableHtmlElement,
    body: HTMLElement
  ): void {
    let author = false;
    let publisher = false;
    let language = false;

    if (authorElement != null) {
      author = true;
      message.setAuthor(HtmlUtil.getTextContent(authorElement as HTMLElement));
    }

    const publisherElement: NullableHtmlElement = body.querySelector(
      ArchiveResolverService.PUBLISHER_ID
    );

    if (publisherElement != null) {
      publisher = true;
      message.setPublisher(HtmlUtil.getTextContent(publisherElement));
    }

    const metadata: HTMLElement[] = body.querySelectorAll(
      ArchiveResolverService.DETAILS_ID
    );

    for (
      let i = 0;
      i < metadata.length && (!language || !publisher || !author);
      i++
    ) {
      const element = metadata[i];
      const entry: Entry<string, string> = this.getDetailElement(element);
      const key: string | null = I18nUtil.getKey(
        ArchiveResolverService.SITE_LANGUAGE,
        entry.getKey()
      );

      if (key != null) {
        switch (key) {
          case LanguageStrings.ASSOCIATED_NAMES_KEY:
            if (!author) {
              author = true;
              message.setAuthor(entry.getValue());
            }
            break;
          case LanguageStrings.LANGUAGE_KEY:
            language = true;
            this.addLanguageTag(message, entry.getValue());
            break;
          case LanguageStrings.PUBLISHER_KEY:
            if (!publisher) {
              publisher = true;
              message.setPublisher(entry.getValue());
            }
            break;
          default:
            break;
        }
      }
    }

    if (!author) {
      throw 'Missing author.';
    }
  }

  private getDetailElement(element: HTMLElement): Entry<string, string> {
    const keyElement: NullableHtmlElement = element.querySelector('dt');
    const valueElement: NullableHtmlElement = element.querySelector('dd');

    if (keyElement != null && valueElement != null) {
      return new Entry<string, string>(
        HtmlUtil.getTextContent(keyElement),
        HtmlUtil.getTextContent(valueElement)
      );
    } else {
      throw 'Error parsing page. Cannot read a product detail.';
    }
  }

  private addLanguageTag(message: Message, language: string): void {
    const languageLowerCase: string = language.toLowerCase();
    if (this.isLanguageTagRequired(languageLowerCase)) {
      message.addTag(languageLowerCase);
    }
  }
}
