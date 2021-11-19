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
