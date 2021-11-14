import { Message } from '../../model/telegram/message';

export interface Validator {
  /**
   * Validate messages
   * @param messages Messages to validate
   */
  validate(messages: Message[]): void;

  /**
   * Refresh cache of elements
   */
  refresh(): Promise<void | void[]>;
}
