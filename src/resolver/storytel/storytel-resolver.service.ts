import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';
import { HtmlUtil } from '../html/html-util';
import { Message } from '../message';
import { SiteResolver } from './../site-resolver.enum';
import {
  StorytelElement,
  StorytelInformation,
  StorytelInformationWrapper,
  StorytelOrganization,
} from './storytel-information';

export class StorytelResolverService extends AbstractResolver {
  private static readonly CONTENT_ID = 'script[type="application/ld+json"]';

  constructor() {
    super();
  }

  extractMessage(html: HTMLElement): Promise<Message> {
    return new Promise<Message>((resolve) => {
      const content: HTMLElement[] = html.querySelectorAll(
        StorytelResolverService.CONTENT_ID
      );

      this.checkRequiredElements(content);

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
      message.addTag(Message.AUDIOBOOK_TAG);

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
}
