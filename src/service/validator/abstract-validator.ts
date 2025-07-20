import { Message } from '../../model/telegram/message';
import { Validation } from '../../model/validator/validation';
import { FilesService, VALIDATOR_PATH } from '../files/filesService';
import { DateUtil } from './../../util/date-util';
import { Validator } from './validator';

export abstract class AbstractValidator<T> implements Validator {
  private static readonly REFRESH_TIMEOUT_HOURS = 12;

  private nextCheck: Date;
  protected elements: T[];

  protected constructor(protected filesService: FilesService) {
    this.nextCheck = new Date();
    this.elements = [];
  }

  listElements(): T[] {
    return [...this.elements];
  }

  validate(messages: Message[]): Validation {
    let result: Validation = Validation.valid();

    for (let i = 0; i < messages.length && result.isValid(); i++) {
      result = this.validateMessage(messages[i]);
    }

    return result;
  }

  /**
   * Mask string
   *
   * @param s String to mask
   * @param placeholder String to add with just one word
   * @returns Masked string
   */
  protected mask(s: string, placeholder: string): string {
    const parts: string[] = s.replace("'", '_').replace(';', '').split(' ');

    if (parts.length == 1) {
      parts.push(parts[0]);
      parts[0] = placeholder;
    }

    return parts.join('_');
  }

  /**
   * Validate a single message
   * @param message Message to validate
   */
  protected abstract validateMessage(message: Message): Validation;

  refresh(force: boolean): Promise<void> {
    let result: Promise<void> = Promise.resolve();

    const now: Date = new Date();

    if (force || now.getTime() >= this.nextCheck.getTime()) {
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
      this.elements = this.filesService.readFile(this.getFilePath(), []);
      console.log(
        this.constructor.name,
        `Fetched ${this.elements.length} elements`
      );
      resolve();
    });
  }

  protected abstract getFilePath(): VALIDATOR_PATH;

  abstract expectedFormats(): string[];

  abstract parse(text: string): T | undefined;

  abstract format(element: T): string;

  protected abstract equal(a: T, b: T): boolean;

  addElement(text: string): T | undefined {
    if (text === undefined || text === '') {
      return undefined;
    }

    const item = this.parse(text);

    if (!item) {
      return undefined;
    }

    if (!this.elements.find((element) => this.equal(element, item))) {
      this.elements.push(item);
      this.filesService.writeFile(this.getFilePath(), this.elements);
    }

    return item;
  }

  removeElement(text: string): T | undefined {
    if (text === undefined || text === '') {
      return undefined;
    }

    const item = this.parse(text);

    if (!item) {
      return undefined;
    }

    const index = this.elements.findIndex((element) =>
      this.equal(element, item)
    );
    if (index > -1) {
      this.elements.splice(index, 1);
      this.filesService.writeFile(this.getFilePath(), this.elements);
    }

    return item;
  }
}
