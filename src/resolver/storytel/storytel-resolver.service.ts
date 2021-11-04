import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';
import { HtmlUtil } from '../html/html-util';
import { Message } from '../message';
import { NullableHtmlElement } from './../html/nullable-html-element';
import { SiteResolver } from './../site-resolver.enum';
import {
  StorytelElement,
  StorytelInformation,
  StorytelInformationWrapper,
  StorytelOrganization,
} from './storytel-information';

export class StorytelResolverService extends AbstractResolver {
  private static readonly CONTENT_ID = 'script[type="application/ld+json"]';
  private static readonly DETAIL_ID = '.detail-header';
  private static readonly BOOK_ID = '.icon-glasses';
  private static readonly AUDIOBOOK_ID = '.icon-headphones';

  constructor() {
    super();
  }

  extractMessage(html: HTMLElement): Promise<Message> {
    return new Promise<Message>((resolve) => {
      const content: HTMLElement[] = html.querySelectorAll(
        StorytelResolverService.CONTENT_ID
      );

      this.checkRequiredElements(content, 'No information available.');

      const detailsNullable: NullableHtmlElement = html.querySelector(
        StorytelResolverService.DETAIL_ID
      );

      this.checkRequiredElements(
        [detailsNullable],
        'Cannot determine the format.'
      );

      const details: HTMLElement = detailsNullable as HTMLElement;

      const bookIcon: NullableHtmlElement = details.querySelector(
        StorytelResolverService.BOOK_ID
      );
      const audiobookIcon: NullableHtmlElement = details.querySelector(
        StorytelResolverService.AUDIOBOOK_ID
      );

      const information: StorytelInformationWrapper =
        this.getStorytelInformation(content);

      // prepare message
      const message: Message = new Message(SiteResolver.STORYTEL);

      // main info
      message.setTitle(information.getTitle());

      message.setAuthor(information.getAuthor());

      message.setPublisher(information.getPublisher());

      // tags
      message.addTag('storytel');
      if (this.isAudiobook(bookIcon, audiobookIcon)) {
        message.addTag(Message.AUDIOBOOK_TAG);
      }

      const language: string = information.getLanguage();
      if (this.isLanguageTagRequired(language)) {
        message.addTag(language);
      }

      resolve(message);
    });
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

  private isAudiobook(
    bookIcon: NullableHtmlElement,
    audiobookIcon: NullableHtmlElement
  ): boolean {
    let result = false;

    if (bookIcon == null && audiobookIcon != null) {
      result = true;
    } else if (bookIcon != null && audiobookIcon == null) {
      result = false;
    } else {
      console.error(bookIcon, audiobookIcon);
      throw 'The product is neither an ebook nor an audiobook.';
    }

    return result;
  }
}
