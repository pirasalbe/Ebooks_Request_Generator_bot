import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import {
  StorytelDetails,
  StorytelDetailsWrapper,
  StorytelElement,
  StorytelFormat,
  StorytelInformation,
  StorytelInformationWrapper,
  StorytelOrganization,
} from '../../../model/resolver/storytel-information';
import { Message } from '../../../model/telegram/message';
import { HtmlUtil } from '../../../util/html-util';
import { I18nUtil } from '../../../util/i18n-util';
import { AbstractResolver } from '../abstract-resolver';
import { StatisticsService } from './../../statistics/statistic.service';

export class StorytelResolverService extends AbstractResolver {
  private static readonly CONTENT_ID = 'script[type="application/ld+json"]';

  private static readonly LANGUAGE_CONTENT_ID = 'script[type="module"]';
  private static readonly LANGUAGE_START_INDEX =
    'requestIdleCallback(function(){         $$ejs(';
  private static readonly LANGUAGE_END_INDEX = ',})}, {timeout: 1000});';

  private static readonly DETAIL_ID = '.detail-header';
  private static readonly BOOK_ID = '.icon-glasses';
  private static readonly AUDIOBOOK_ID = '.icon-headphones';

  constructor(statisticsService: StatisticsService) {
    super(statisticsService);
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const content: HTMLElement[] = html.querySelectorAll(
        StorytelResolverService.CONTENT_ID
      );

      this.checkRequiredElements(content, 'No information available.');

      const languageNullable: NullableHtmlElement = html.querySelector(
        StorytelResolverService.LANGUAGE_CONTENT_ID
      );

      const detailsNullable: NullableHtmlElement = html.querySelector(
        StorytelResolverService.DETAIL_ID
      );

      this.checkRequiredElements(
        [languageNullable, detailsNullable],
        'Cannot determine the format and the language.'
      );

      const details: HTMLElement = detailsNullable as HTMLElement;

      const bookIcon: NullableHtmlElement = details.querySelector(
        StorytelResolverService.BOOK_ID
      );
      const audiobookIcon: NullableHtmlElement = details.querySelector(
        StorytelResolverService.AUDIOBOOK_ID
      );

      const languageElement: HTMLElement = languageNullable as HTMLElement;

      const information: StorytelInformationWrapper =
        this.getStorytelInformation(content);

      // prepare message
      const message: Message = new Message(SiteResolver.STORYTEL, url);

      // main info
      message.setTitle(information.getTitle());

      message.setAuthor(information.getAuthor());

      message.setPublisher(information.getPublisher());

      const publicationDate: string | null = information.getDatePublished();
      if (publicationDate != null) {
        message.setPublicationDate(new Date(publicationDate));
      }

      // tags
      message.addTag('storytel');

      let language: string | null = information.getLanguage();
      if (!this.isLanguageDefined(language)) {
        language = this.getLanguageInformation(languageElement);
      }

      if (this.isLanguageTagRequired(language)) {
        message.addTag(language as string);
      }

      const messages: Message[] = [];

      switch (this.getFormat(bookIcon, audiobookIcon)) {
        case StorytelFormat.BOTH:
          messages.push(message.clone());
          message.addTag(Message.AUDIOBOOK_TAG);
          break;
        case StorytelFormat.AUDIOBOOK:
          message.addTag(Message.AUDIOBOOK_TAG);
          break;
        case StorytelFormat.EBOOK:
        default:
          break;
      }

      messages.push(message);

      resolve(messages);
    });
  }

  private getLanguageInformation(languageElement: HTMLElement): string {
    let result: string = I18nUtil.ENGLISH;

    const script: string = HtmlUtil.getRawText(languageElement).replaceAll(
      '\n',
      ' '
    );

    const start: number = script.indexOf(
      StorytelResolverService.LANGUAGE_START_INDEX
    );
    const end: number = script.indexOf(
      StorytelResolverService.LANGUAGE_END_INDEX
    );

    if (start > -1 && end > -1) {
      const details: StorytelDetails | null = this.getStorytelDetails(
        script,
        start,
        end
      );

      if (details != null && details.book.language.name != '') {
        result = details.book.language.name.toLowerCase();
      }
    }

    return result;
  }

  private getStorytelDetails(
    script: string,
    start: number,
    end: number
  ): StorytelDetails | null {
    let result: StorytelDetails | null = null;

    const jsonString: string =
      script
        // obtain the useful part
        .substring(
          start + StorytelResolverService.LANGUAGE_START_INDEX.length,
          end
        )
        // fix quotes
        .replaceAll("{'", '{"')
        .replaceAll("},'", '},"')
        .replaceAll("' : { 'component' : '", '" : { "component" : "')
        .replaceAll("', 'props'", '", "props"') + '}';

    const json: any = JSON.parse(jsonString);

    const keys: string[] = Object.keys(json);
    for (let i = 0; i < keys.length && result == null; i++) {
      const key = keys[i];
      if (key.startsWith('bookselect')) {
        const wrapper: StorytelDetailsWrapper = json[
          key
        ] as StorytelDetailsWrapper;

        result = wrapper.props;
      }
    }

    return result;
  }

  private getStorytelInformation(
    contentElements: HTMLElement[]
  ): StorytelInformationWrapper {
    let book: StorytelInformation | null = null;
    let audiobook: StorytelInformation | null = null;
    let organization: StorytelOrganization | null = null;

    for (const contentElement of contentElements) {
      const contentString = HtmlUtil.getRawText(contentElement);
      const content: StorytelElement = JSON.parse(contentString);

      if (content != undefined && content['@type'] != undefined) {
        if (content['@type'] == 'Audiobook') {
          audiobook = content as StorytelInformation;
        } else if (content['@type'] == 'Book') {
          book = content as StorytelInformation;
        } else if (content['@type'] == 'Organization') {
          organization = content as StorytelOrganization;
        }
      }
    }

    if (audiobook == null || book == null || organization == null) {
      throw 'Error parsing page. Cannot get Storytel information.';
    }

    return new StorytelInformationWrapper(book, audiobook, organization);
  }

  private getFormat(
    bookIcon: NullableHtmlElement,
    audiobookIcon: NullableHtmlElement
  ): StorytelFormat {
    let result: StorytelFormat | null = null;

    if (bookIcon == null && audiobookIcon != null) {
      result = StorytelFormat.AUDIOBOOK;
    } else if (bookIcon != null && audiobookIcon == null) {
      result = StorytelFormat.EBOOK;
    } else if (bookIcon != null && audiobookIcon != null) {
      result = StorytelFormat.BOTH;
    } else {
      console.error(bookIcon, audiobookIcon);
      throw 'The product is neither an ebook nor an audiobook.';
    }

    return result;
  }
}
