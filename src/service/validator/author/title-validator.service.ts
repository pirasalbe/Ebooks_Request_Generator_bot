import { RequestOptions } from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { Message } from '../../../model/telegram/message';
import { Title } from '../../../model/validator/title';
import { Validation } from '../../../model/validator/validation';
import { HtmlUtil } from '../../../util/html-util';
import { AbstractValidator } from '../abstract-validator';

export class TitleValidatorService extends AbstractValidator<Title> {
  private static readonly TITLES =
    'https://telegra.ph/Copyright--Book-Titles-04-15';
  private static readonly BEGIN_LIST = '𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚊𝚔𝚎 𝚗𝚘𝚝𝚎';
  private static readonly LIST_ELEMENT_START = '▫︎ ';
  private static readonly BY = 'By';

  constructor() {
    super();
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const title: string | null = message.getTitle();
    const author: string | null = message.getAuthor();
    if (title != null && author != null) {
      const protectedTitle: Title | undefined = this.elements.find(
        (t: Title) =>
          title.toLowerCase().startsWith(t.title.toLowerCase()) &&
          author.toLowerCase() == t.author.toLowerCase()
      );
      if (protectedTitle != undefined) {
        result = Validation.invalid(
          'Your #request of ' +
            this.mask(
              protectedTitle.title + ' by ' + protectedTitle.author,
              'Book'
            ) +
            " is protected by DMCA and can't be displayed here."
        );
      }
    }

    return result;
  }

  protected getElementsLink(): string | RequestOptions | URL {
    return TitleValidatorService.TITLES;
  }

  protected parseElements(html: HTMLElement): Title[] {
    const elements: Title[] = [];
    const htmlElements: HTMLElement[] = html.querySelectorAll('p');

    let isList = false;
    let title: string | null = null;
    for (const htmlElement of htmlElements) {
      const content: string = HtmlUtil.getTextContent(htmlElement).trim();
      if (
        isList &&
        content.startsWith(TitleValidatorService.LIST_ELEMENT_START) &&
        content.includes(TitleValidatorService.BY)
      ) {
        // title by author
        const parts: string[] = content
          .substring(TitleValidatorService.LIST_ELEMENT_START.length)
          .split(TitleValidatorService.BY);

        if (parts.length == 2) {
          elements.push({
            title: parts[0].trim(),
            author: parts[1].trim(),
          });
        }
      } else if (
        isList &&
        content.startsWith(TitleValidatorService.LIST_ELEMENT_START)
      ) {
        // title
        title = content.substring(
          TitleValidatorService.LIST_ELEMENT_START.length
        );
      } else if (isList && title != null && content.length > 0) {
        // author
        const author: string = content
          .replace(TitleValidatorService.BY, '')
          .trim();

        elements.push({ title: title, author: author });
        title = null;
      }

      // the following elements are in the list
      isList = this.isListBegin(isList, content);
    }

    return elements;
  }

  private isListBegin(isList: boolean, content: string): boolean {
    if (!isList && content.includes(TitleValidatorService.BEGIN_LIST)) {
      isList = true;
    }

    return isList;
  }
}
