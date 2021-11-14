import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { AbstractValidator } from '../abstract-validator';

export class AuthorValidatorService extends AbstractValidator<string> {
  constructor() {
    super();
  }

  validate(messages: Message[]): Validation {
    let result: Validation = Validation.valid();

    for (let i = 0; i < messages.length && result.isValid(); i++) {
      result = this.checkAuthor(messages[i]);
    }

    return result;
  }

  private checkAuthor(message: Message): Validation {
    let result: Validation = Validation.valid();

    const author: string | null = message.getAuthor();
    if (author != null && this.elements.includes(author)) {
      result = Validation.invalid(
        author + ' is either an academic author or protected by DMCA.'
      );
    }

    return result;
  }

  updateElements(): Promise<void> {
    // TODO
    return Promise.resolve();
  }
}
