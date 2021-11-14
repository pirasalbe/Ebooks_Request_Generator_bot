import { Message } from '../../model/telegram/message';
import { Validation } from '../../model/validator/validation';
import { DateUtil } from './../../util/date-util';
import { Validator } from './validator';

export abstract class AbstractValidator<T> implements Validator {
  private static readonly REFRESH_TIMEOUT_HOURS = 12;

  private nextCheck: Date;
  protected elements: T[];

  protected constructor() {
    this.nextCheck = new Date();
    this.elements = [];
  }

  validate(messages: Message[]): Validation {
    let result: Validation = Validation.valid();

    for (let i = 0; i < messages.length && result.isValid(); i++) {
      result = this.validateMessage(messages[i]);
    }

    return result;
  }

  /**
   * Validate a single message
   * @param message Message to validate
   */
  protected abstract validateMessage(message: Message): Validation;

  refresh(): Promise<void> {
    let result: Promise<void> = Promise.resolve();

    const now: Date = new Date();

    if (now.getTime() >= this.nextCheck.getTime()) {
      this.nextCheck = DateUtil.addHours(
        now,
        AbstractValidator.REFRESH_TIMEOUT_HOURS
      );
      result = this.updateElements();
    }

    return result;
  }

  /**
   * Resolve and update the elements for validations
   */
  private updateElements(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.resolveElements()
        .then((elements: T[]) => {
          this.elements = elements;
          resolve();
        })
        .catch((error) => {
          console.error(
            'There was an error resolving elements for validation',
            error
          );
          resolve();
        });
    });
  }

  protected abstract resolveElements(): Promise<T[]>;
}
