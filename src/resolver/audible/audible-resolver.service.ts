import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { Message } from '../message';
import { HtmlUtil } from './../html/html-util';
import { AudibleAuthor, AudibleInformation } from './audible-information';

export class AudibleResolverService extends AbstractResolver {
  private static readonly BOTTOM_ID = '#bottom-0';
  private static readonly SCRIPT_ID = 'script';

  constructor() {
    super();
  }

  resolve(url: string): Promise<string> {
    // override redirect
    if (url.includes('?')) {
      url += '&';
    } else {
      url += '?';
    }
    url += 'ipRedirectOverride=true';

    return super.resolve(url);
  }

  extractMessage(html: HTMLElement): Message {
    const bottom: NullableHtmlElement = html.querySelector(
      AudibleResolverService.BOTTOM_ID
    );

    this.checkRequiredElements([bottom]);

    const information: AudibleInformation = this.getAudibleInformation(
      bottom as HTMLElement
    );

    // prepare message
    const message: Message = new Message();

    // main info
    message.setTitle(information.name);

    message.setAuthor(
      information.author.map((a: AudibleAuthor) => a.name).join(', ')
    );

    message.setPublisher(information.publisher);

    // tags
    message.addTag(Message.AUDIOBOOK_TAG);

    if (this.isLanguageTagRequired(information.inLanguage)) {
      message.addTag(information.inLanguage);
    }

    return message;
  }

  getAudibleInformation(bottom: HTMLElement): AudibleInformation {
    const scripts: HTMLElement[] = (bottom as HTMLElement).querySelectorAll(
      AudibleResolverService.SCRIPT_ID
    );

    let information: AudibleInformation | null = null;

    for (let i = 0; i < scripts.length && information == null; i++) {
      const script = scripts[i];
      const contentString = HtmlUtil.getRawText(script);

      const content: any[] = JSON.parse(contentString);
      for (let i = 0; i < content.length; i++) {
        const obj = content[i] as AudibleInformation;
        if (obj.bookFormat != null && obj.bookFormat != undefined) {
          information = obj;
        }
      }
    }

    if (information == null) {
      throw 'Error parsing page. Cannot get audiobook information.';
    }

    return information;
  }
}
