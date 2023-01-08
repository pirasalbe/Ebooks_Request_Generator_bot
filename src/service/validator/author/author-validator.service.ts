import { RequestOptions } from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { AbstractValidator } from '../abstract-validator';
import { HtmlUtil } from './../../../util/html-util';

export class AuthorValidatorService extends AbstractValidator<string> {
  private static readonly AUTHORS =
    'https://graph.org/Copyright--Authors-04-15';
  private static readonly BEGIN_LIST = '𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚊𝚔𝚎 𝚗𝚘𝚝𝚎';
  private static readonly LIST_ELEMENT_START = '▫︎ ';

  constructor() {
    super();
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const authors: string[] = message.getAuthors();
    if (authors.length > 0) {
      const author: string | undefined = authors.find(
        (a: string) =>
          this.elements.findIndex(
            (e: string) => e.toLowerCase() == a.toLowerCase()
          ) > -1
      );
      if (author != undefined) {
        result = Validation.invalid(
          'The author of your #request, ' +
            this.mask(author, 'Author') +
            ", is either academic or protected by DMCA and can't be displayed here."
        );
      }
    }

    return result;
  }

  protected getElementsLink(): string | RequestOptions | URL {
    return AuthorValidatorService.AUTHORS;
  }

  protected parseElements(html: HTMLElement): string[] {
    const elements: string[] = [];
    const htmlElements: HTMLElement[] = html.querySelectorAll('p');

    let isList = false;
    for (const htmlElement of htmlElements) {
      const content: string = HtmlUtil.getTextContent(htmlElement).trim();
      if (
        isList &&
        content.startsWith(AuthorValidatorService.LIST_ELEMENT_START)
      ) {
        elements.push(
          content
            .substring(AuthorValidatorService.LIST_ELEMENT_START.length)
            .toLowerCase()
        );
      }

      // the following elements are in the list
      isList = this.isListBegin(
        isList,
        content,
        AuthorValidatorService.BEGIN_LIST
      );
    }

    return elements;
  }
}
