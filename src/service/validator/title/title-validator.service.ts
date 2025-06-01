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
    'https://telegra.ph/D%E1%B4%8D%E1%B4%84%E1%B4%80-T%C9%AA%E1%B4%9B%CA%9F%E1%B4%87s-05-31';
  private static readonly BEGIN_LIST = '𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚊𝚔𝚎 𝚗𝚘𝚝𝚎';
  private static readonly LIST_ELEMENT_START: string[] = ['▫︎ ', '▫️ '];
  private static readonly BY = 'By';

  constructor() {
    super();
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const title: string | null = message.getTitle();
    const authors: string[] = message.getAuthors();
    if (title != null && authors.length > 0) {
      const protectedTitle: Title | undefined = this.elements.find(
        (t: Title) =>
          title.toLowerCase().startsWith(t.title.toLowerCase()) &&
          authors.findIndex(
            (a: string) => a.toLowerCase() == t.author.toLowerCase()
          ) > -1
      );
      if (protectedTitle != undefined) {
        result = Validation.invalid(
          'Your #request of ' +
            this.mask(
              protectedTitle.title + ' by ' + protectedTitle.author,
              'Book'
            ) +
            " is protected by DMCA and can't be requested here."
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
        TitleValidatorService.LIST_ELEMENT_START.some((start) =>
          content.startsWith(start)
        ) &&
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
        TitleValidatorService.LIST_ELEMENT_START.some((start) =>
          content.startsWith(start)
        )
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
      isList = this.isListBegin(
        isList,
        content,
        TitleValidatorService.BEGIN_LIST
      );
    }

    return elements;
  }
}
