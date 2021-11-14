import { Message } from '../../model/telegram/message';
import { Validation } from '../../model/validator/validation';
import { DateUtil } from './../../util/date-util';
import { Validator } from './validator';

export abstract class AbstractValidator implements Validator {
  private static readonly REFRESH_TIMEOUT_HOURS = 12;

  private nextCheck: Date;
  protected elements: string[];

  protected constructor() {
    this.nextCheck = new Date();
    this.elements = [];
  }

  abstract validate(messages: Message[]): Validation;

  refresh(): Promise<void> {
    let result: Promise<void> = Promise.resolve();

    const now: Date = new Date();

    if (now.getTime() >= this.nextCheck.getTime()) {
      this.nextCheck = DateUtil.addHours(
        now,
        AbstractValidator.REFRESH_TIMEOUT_HOURS
      );
      this.elements = [];

      result = this.updateElements();
    }

    return result;
  }

  /**
   * Resolve and update the elements for validations
   */
  abstract updateElements(): Promise<void>;
}
