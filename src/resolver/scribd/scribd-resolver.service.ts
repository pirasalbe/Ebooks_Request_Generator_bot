import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { Message } from '../message';

export class ScribdResolverService extends AbstractResolver {
  private static readonly BOTTOM_ID = 'ipRedirectOverride';

  constructor() {
    super();
  }

  extractMessage(html: HTMLElement): Promise<Message> {
    return new Promise<Message>((resolve) => {
      const bottom: NullableHtmlElement = html.querySelector(
        ScribdResolverService.BOTTOM_ID
      );

      this.checkRequiredElements([bottom]);

      // prepare message
      const message: Message = new Message();

      // main info
      // message.setTitle(information.name);

      // message.setAuthor(
      //   information.author.map((a: AudibleAuthor) => a.name).join(', ')
      // );

      // message.setPublisher(information.publisher);

      // tags
      message.addTag('scribd');

      // if (this.isLanguageTagRequired(information.inLanguage)) {
      //   message.addTag(information.inLanguage);
      // }

      resolve(message);
    });
  }
}
