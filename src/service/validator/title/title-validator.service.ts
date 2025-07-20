import { Message } from '../../../model/telegram/message';
import { Title } from '../../../model/validator/title';
import { Validation } from '../../../model/validator/validation';
import { FilesService, VALIDATOR_PATH } from '../../files/filesService';
import { AbstractValidator } from '../abstract-validator';

export class TitleValidatorService extends AbstractValidator<Title> {
  constructor(filesService: FilesService) {
    super(filesService);
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

  protected getFilePath(): VALIDATOR_PATH {
    return 'titles';
  }

  expectedFormats(): string[] {
    return ['Book title\nAuthor'];
  }

  parse(text: string): Title | undefined {
    const parts = text.split('\n');
    return parts.length == 2
      ? {
          title: parts[0].trim(),
          author: parts[1].trim(),
        }
      : undefined;
  }

  format(element: Title): string {
    return element.title + '\n' + element.author;
  }

  protected equal(a: Title, b: Title): boolean {
    return a.author === b.author && a.title === b.title;
  }

  protected compare(a: Title, b: Title): number {
    return a.title.localeCompare(b.title);
  }
}
