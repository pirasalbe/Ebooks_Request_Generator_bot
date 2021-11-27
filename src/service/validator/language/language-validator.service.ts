import { Message } from '../../../model/telegram/message';
import { Validation } from '../../../model/validator/validation';
import { Validator } from './../validator';

export class LanguageValidatorService implements Validator {
  private static readonly INVALID_LANGUAGE = 'malayalam';

  refresh(): Promise<void | void[]> {
    return Promise.resolve();
  }

  validate(messages: Message[]): Validation {
    let result: Validation = Validation.valid();

    for (let i = 0; i < messages.length && result.isValid(); i++) {
      result = this.validateMessage(messages[i]);
    }

    return result;
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const language: string | null = message.getLanguage();
    if (
      language != null &&
      language === LanguageValidatorService.INVALID_LANGUAGE
    ) {
      result = Validation.invalid(
        'The language of your #request, ' + language + ', is not allowed.'
      );
    }

    return result;
  }
}
