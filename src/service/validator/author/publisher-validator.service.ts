import { RequestOptions } from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { HtmlUtil } from '../../../util/html-util';
import { AbstractValidator } from '../abstract-validator';

export class PublisherValidatorService extends AbstractValidator<string> {
  private static readonly PUBLISHERS =
    'https://telegra.ph/DMCA-Publishers-List-09-21-3';
  private static readonly BEGIN_LIST = '𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚊𝚔𝚎 𝚗𝚘𝚝𝚎';
  private static readonly LIST_ELEMENT_START = '· ';

  constructor() {
    super();
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const publisher: string | null = message.getPublisher();
    if (publisher != null) {
      const academicPublisher: string | undefined = this.elements.find(
        (p: string) => publisher.toLowerCase().startsWith(p)
      );
      if (academicPublisher != undefined) {
        result = Validation.invalid(
          'The publisher of your #request, ' +
            this.mask(publisher, 'Publisher') +
            ", is academic and can't be displayed here."
        );
      }
    }

    return result;
  }

  protected getElementsLink(): string | RequestOptions | URL {
    return PublisherValidatorService.PUBLISHERS;
  }

  protected parseElements(html: HTMLElement): string[] {
    const elements: string[] = [];
    const htmlElements: HTMLElement[] = html.querySelectorAll('p');

    let isList = false;
    for (const htmlElement of htmlElements) {
      const content: string = HtmlUtil.getTextContent(htmlElement).trim();
      if (
        isList &&
        content.startsWith(PublisherValidatorService.LIST_ELEMENT_START)
      ) {
        elements.push(
          content
            .substring(PublisherValidatorService.LIST_ELEMENT_START.length)
            .toLowerCase()
        );
      }

      // the following elements are in the list
      isList = this.isListBegin(isList, content);
    }

    return elements;
  }

  private isListBegin(isList: boolean, content: string): boolean {
    if (!isList && content.includes(PublisherValidatorService.BEGIN_LIST)) {
      isList = true;
    }

    return isList;
  }
}
