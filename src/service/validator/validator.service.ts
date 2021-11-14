import { Message } from '../../model/telegram/message';
import { Validator } from './validator';

export class ValidatorService implements Validator {
  private validators: Validator[];

  constructor(validators: Validator[]) {
    this.validators = validators;
  }

  validate(messages: Message[]): void {
    for (const validator of this.validators) {
      validator.validate(messages);
    }
  }

  refresh(): Promise<void[]> {
    const promises: Promise<void>[] = [];

    for (const validator of this.validators) {
      promises.push(validator.refresh() as Promise<void>);
    }

    return Promise.all(promises);
  }
}
