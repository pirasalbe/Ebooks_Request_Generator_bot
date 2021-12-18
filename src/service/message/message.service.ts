import { Exception } from '../../model/error/exception';
import { ResolverException } from '../../model/error/resolver-exception';
import { Message } from '../../model/telegram/message';
import { Validation } from '../../model/validator/validation';
import { ResolverService } from '../resolver/resolver.service';
import { ValidatorService } from '../validator/validator.service';
import { TwitterService } from './../twitter/twitter.service';

export class MessageService {
  private resolverService: ResolverService;
  private validatorService: ValidatorService;
  private twitterService: TwitterService | null;

  constructor(
    resolverService: ResolverService,
    validatorService: ValidatorService,
    twitterService: TwitterService | null
  ) {
    this.resolverService = resolverService;
    this.validatorService = validatorService;
    this.twitterService = twitterService;
  }

  /**
   * Get the messages by:
   * - resolving them from the website in the text
   * - verifying the author, title and publisher
   *
   * @param text The URL
   * @returns Promise with a list of messages
   */
  getMessages(text: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      try {
        this.resolverService
          .resolve(text)
          .then((messages: Message[]) => {
            const validation: Validation = this.areMessagesValid(messages);
            if (validation.isValid()) {
              this.tweet(messages);
              resolve(messages);
            } else {
              console.error('Invalid messages', validation.getError());
              reject(validation.getError());
            }
          })
          .catch((error: string) => {
            console.error(
              'Error resolving message',
              text,
              this.getErrorMessage(error)
            );
            reject(error);
          });
      } catch (error) {
        console.error(
          'Error handling request',
          text,
          this.getErrorMessage(error)
        );
        reject('There was an error handling your request.');
      }
    });
  }

  private areMessagesValid(messages: Message[]): Validation {
    // trigger refresh
    this.validatorService.refresh();

    // validate messages
    return this.validatorService.validate(messages);
  }

  isResolverException(error: unknown): boolean {
    const exception: ResolverException = error as ResolverException;

    return exception != undefined && exception.html != undefined;
  }

  getErrorMessage(error: unknown): string {
    let result = String(error);
    const errorObj: Error = error as Error;
    const exception: Exception = error as Exception;

    if (exception != undefined && exception.message != undefined) {
      result = exception.message;
    } else if (errorObj != undefined && errorObj.message != undefined) {
      result = errorObj.message;
    }

    return result;
  }

  private tweet(messages: Message[]): void {
    if (this.twitterService != null) {
      this.twitterService.tweet(messages);
    }
  }
}
