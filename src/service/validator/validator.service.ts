import { Message } from '../../model/telegram/message';
import { Validation } from '../../model/validator/validation';
import { Validator } from './validator';

export class ValidatorService implements Validator {
  private validators: Validator[];

  constructor(validators: Validator[]) {
    this.validators = validators;
  }

  validate(messages: Message[]): Validation {
    let result: Validation = Validation.valid();

    for (let i = 0; i < this.validators.length && result.isValid(); i++) {
      const validator = this.validators[i];
      result = validator.validate(messages);
    }

    return result;
  }

  refresh(): Promise<void[]> {
    const promises: Promise<void>[] = [];

    for (const validator of this.validators) {
      promises.push(validator.refresh() as Promise<void>);
    }

    return Promise.all(promises);
  }
}
