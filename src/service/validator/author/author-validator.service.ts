import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { AbstractValidator } from '../abstract-validator';

export class AuthorValidatorService extends AbstractValidator<string> {
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

  protected resolveElements(): Promise<string[]> {
    // TODO
    return Promise.resolve([]);
  }
}
