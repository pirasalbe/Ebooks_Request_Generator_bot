import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { FilesService, VALIDATOR_PATH } from '../../files/filesService';
import { AbstractValidator } from '../abstract-validator';

export class AuthorValidatorService extends AbstractValidator<string> {
  private static readonly BEGIN_LIST = '𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚊𝚔𝚎 𝚗𝚘𝚝𝚎';
  private static readonly LIST_ELEMENT_START: string[] = ['▫︎ ', '▫️ '];

  constructor(filesService: FilesService) {
    super(filesService);
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
            ", is either academic or protected by DMCA and can't be requested here."
        );
      }
    }

    return result;
  }

  protected getFilePath(): VALIDATOR_PATH {
    return 'authors';
  }

  protected parse(text: string): string | undefined {
    return text;
  }
}
