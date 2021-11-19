import { RequestOptions } from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { AbstractValidator } from '../abstract-validator';
import { HtmlUtil } from './../../../util/html-util';

export class AuthorValidatorService extends AbstractValidator<string> {
  private static readonly AUTHORS =
    'https://telegra.ph/Copyright--Authors-04-15';
  private static readonly BEGIN_LIST = '𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚊𝚔𝚎 𝚗𝚘𝚝𝚎';
  private static readonly LIST_ELEMENT_START = '▫︎ ';

  constructor() {
    super();
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const author: string | null = message.getAuthor();
    if (author != null && this.elements.includes(author)) {
      result = Validation.invalid(
        author + ' is either an academic author or protected by DMCA.'
      );
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
          content.substring(AuthorValidatorService.LIST_ELEMENT_START.length)
        );
      }

      // the following elements are in the list
      isList = this.isListBegin(isList, content);
    }

    return elements;
  }

  private isListBegin(isList: boolean, content: string): boolean {
    if (!isList && content.includes(AuthorValidatorService.BEGIN_LIST)) {
      isList = true;
    }

    return isList;
  }
}
