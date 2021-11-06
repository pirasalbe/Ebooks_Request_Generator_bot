import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { AbstractResolver } from '../abstract-resolver';
import { HtmlUtil } from '../html/html-util';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { Message } from '../message';
import { SiteResolver } from './../site-resolver.enum';
import { ScribdInformation, ScribdInformationWrapper } from './scribd-information';

export class ScribdResolverService extends AbstractResolver {
  private static readonly CONTENT_ID =
    'script[data-hypernova-key="contentpreview"]';

  constructor() {
    super();
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const content: NullableHtmlElement = html.querySelector(
        ScribdResolverService.CONTENT_ID
      );

      this.checkRequiredElements([content]);

      const information: ScribdInformation = this.getScribdInformation(
        content as HTMLElement
      );

      if (
        information.contentType !== 'book' &&
        information.contentType !== 'audiobook'
      ) {
        throw 'The product is neither an ebook nor an audiobook.';
      }

      // prepare message
      const message: Message = new Message(SiteResolver.SCRIBD, url);

      // main info
      message.setTitle(information.title);

      message.setAuthor(information.author.name);

      message.setPublisher(information.publisher.name);

      // tags
      message.addTag('scribd');
      if (information.contentType === 'audiobook') {
        message.addTag(Message.AUDIOBOOK_TAG);
      }

      resolve([message]);
    });
  }

  private getScribdInformation(contentElement: HTMLElement): ScribdInformation {
    let information: ScribdInformation | null = null;

    const contentString = HtmlUtil.getRawText(contentElement);

    const content: ScribdInformationWrapper = JSON.parse(
      this.sanitizeContentString(contentString)
    );

    if (
      content != undefined &&
      content.contentItem != undefined &&
      content.contentItem.title != undefined
    ) {
      information = content.contentItem;
    } else {
      throw 'Error parsing page. Cannot get scribd information.';
    }

    return information;
  }

  private sanitizeContentString(content: string): string {
    return content.replace('<!--', '').replace('-->', '');
  }
}
