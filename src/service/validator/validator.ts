import { Message } from '../../model/telegram/message';
import { Validation } from './../../model/validator/validation';

export interface Validator {
  /**
   * Validate messages
   * @param messages Messages to validate
   */
  validate(messages: Message[]): Validation;

  /**
   * Refresh cache of elements
   */
  refresh(): Promise<void | void[]>;
}
