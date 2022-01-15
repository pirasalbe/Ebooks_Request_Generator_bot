import { URL } from 'url';
import { Message } from '../../../../model/telegram/message';
import { Resolver } from '../../resolver';
import { AmazonApiService } from './amazon-api.service';
import * as SDK from 'paapi5-typescript-sdk';
import { SiteResolver } from '../../../../model/resolver/site-resolver.enum';

export class AmazonApiResolverService implements Resolver {
  private static readonly ASIN_PATTERN: RegExp = new RegExp(
    '^([A-Z]|[0-9]){10}$'
  );

  private amazonApiService: AmazonApiService;

  constructor(amazonApiService: AmazonApiService) {
    this.amazonApiService = amazonApiService;
  }

  private getAsin(url: URL): string | undefined {
    const pieces: string[] = url.pathname.split('/');

    return pieces.find((piece: string) =>
      AmazonApiResolverService.ASIN_PATTERN.test(piece)
    );
  }

  resolve(url: URL): Promise<Message[]> {
    let result: Promise<Message[]>;

    const itemId: string | undefined = this.getAsin(url);

    if (itemId != undefined) {
      result = new Promise<Message[]>((resolve, reject) =>
        this.amazonApiService
          .getItemsRequest(itemId)
          .then((item: SDK.Item) => {
            // prepare message
            const message: Message = new Message(
              SiteResolver.AMAZON,
              new URL(item.DetailPageURL)
            );
            // main info
            const itemInfo: SDK.ItemInfo = item.ItemInfo as SDK.ItemInfo;
            const title: SDK.Title = itemInfo.Title as SDK.Title;
            const contributors: SDK.ByLineInfo =
              itemInfo.ByLineInfo as SDK.ByLineInfo;
            message.setTitle(title.DisplayValue);
            if (contributors.Contributors.length > 0) {
              for (const contributor of contributors.Contributors) {
                if (contributor.RoleType == SDK.RoleType.AUTHOR) {
                  message.addAuthor(this.fixAuthorName(contributor.Name));
                }
              }
            } else {
              message.addAuthor('');
            }

            // this.setPublicationDate(
            //   message,
            //   siteLanguage,
            //   amazonDetails.getPublicationDate(),
            //   amazonDetails.getPublisher()
            // );
            // this.setPublisher(message, amazonDetails.getPublisher());
            // // tags
            // if (amazonDetails.hasLanguage()) {
            //   this.addLanguageTag(
            //     message,
            //     siteLanguage,
            //     amazonDetails.getLanguage() as string
            //   );
            // }
            resolve([message]);
          })
          .catch(() => reject())
      );
    } else {
      result = Promise.reject();
    }

    return result;
  }

  private fixAuthorName(name: string): string {
    let author: string = name;

    if (name.includes(',')) {
      const parts: string[] = name.split(',');

      author = parts[1].trim() + ' ' + parts[0].trim();
    }

    return author;
  }
}
