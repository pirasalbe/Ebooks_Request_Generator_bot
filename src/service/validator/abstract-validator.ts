import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';

import { Message } from '../../model/telegram/message';
import { Validation } from '../../model/validator/validation';
import { HttpUtil } from '../../util/http-util';
import { DateUtil } from './../../util/date-util';
import { HtmlUtil } from './../../util/html-util';
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
   * Mask string, replacing half with *
   *
   * @param s String to mask
   * @returns Masked string
   */
  protected mask(s: string): string {
    const parts: string[] = s.split(' ');
    for (let i = 0; i < parts.length; i++) {
      parts[i] = this.replace(parts[i], parts[i].length / 2);
    }

    return parts.join(' ');
  }

  /**
   * Replace [length] letters of [s] with [newChar]
   *
   * @param s String
   * @param length Hidden letters count
   * @param newChar Char to hide the letters
   * @returns String with letters replaced
   */
  private replace(s: string, length: number, newChar = '*'): string {
    let newString = '';
    for (let i = 0; i < s.length; i++) {
      newString += i < Math.round(length) ? s[i] : newChar;
    }

    return newString;
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
      https.get(this.getElementsLink(), (response: http.IncomingMessage) => {
        this.processResponse(response)
          .then(() => resolve())
          .catch((error) => {
            console.error(
              'There was an error resolving elements for validation',
              error
            );
            resolve();
          });
      });
    });
  }

  protected abstract getElementsLink():
    | string
    | https.RequestOptions
    | import('url').URL;

  /**
   * Process the response based on the status code
   *
   * @param response Call response
   * @returns Promise
   */
  protected processResponse(response: http.IncomingMessage): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (response.statusCode == 200) {
        // success
        this.processSuccessfulResponse(response)
          .then(() => resolve())
          .catch((error) => reject(error));
      } else {
        // something went wrong
        reject('Error: ' + response.statusCode);
      }
    });
  }

  /**
   * Process a response with status 200
   *
   * @param response Call response
   * @returns Promise
   */
  protected processSuccessfulResponse(
    response: http.IncomingMessage
  ): Promise<void> {
    return HttpUtil.processSuccessfulResponse(response, (data: string) => {
      return new Promise<void>((resolve) => {
        this.elements = this.parseElements(HtmlUtil.parseHTML(data));
        resolve();
      });
    });
  }

  protected abstract parseElements(html: HTMLElement): T[];
}
