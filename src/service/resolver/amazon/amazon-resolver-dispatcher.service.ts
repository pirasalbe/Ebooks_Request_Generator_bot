import { AmazonApiException } from './../../../model/error/amazon/amazon-api-exception';
import { URL } from 'url';
import { Message } from '../../../model/telegram/message';
import { Resolver } from '../resolver';
import { AmazonResolverService } from './html/amazon-resolver.service';
import { AmazonApiResolverService } from './api/amazon-api-resolver.service';

export class AmazonResolverDispatcher implements Resolver {
  private amazonApiResolverService: AmazonApiResolverService;
  private amazonResolverService: AmazonResolverService;

  constructor(
    amazonApiResolverService: AmazonApiResolverService,
    amazonResolverService: AmazonResolverService
  ) {
    this.amazonApiResolverService = amazonApiResolverService;
    this.amazonResolverService = amazonResolverService;
  }

  resolve(url: URL): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      // try with API
      this.amazonApiResolverService
        .resolve(url)
        .then((messages: Message[]) => resolve(messages))
        .catch((error: any) => {
          console.error('Cannot resolve message using Amazon API', error);

          // with errors use the html resolver
          if (this.isAmazonApiException(error)) {
            this.amazonResolverService
              .resolve(url)
              .then((messages: Message[]) => resolve(messages))
              .catch((error: any) => reject(error));
          } else {
            reject(error);
          }
        });
    });
  }

  private isAmazonApiException(error: any): boolean {
    const exception: AmazonApiException = error as AmazonApiException;

    return exception != undefined && exception.errors !== undefined;
  }
}
