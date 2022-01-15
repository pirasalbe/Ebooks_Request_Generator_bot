import { I18nUtil } from './../../../../util/i18n-util';
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
            const lineInfo: SDK.ByLineInfo =
              itemInfo.ByLineInfo as SDK.ByLineInfo;
            const contentInfo: SDK.ContentInfo =
              itemInfo.ContentInfo as SDK.ContentInfo;

            message.setTitle(title.DisplayValue);

            if (lineInfo.Contributors.length > 0) {
              for (const contributor of lineInfo.Contributors) {
                if (contributor.RoleType == SDK.RoleType.AUTHOR) {
                  message.addAuthor(this.fixAuthorName(contributor.Name));
                }
              }
            } else {
              message.addAuthor('');
            }

            if (lineInfo.Manufacturer != undefined) {
              message.setPublisher(lineInfo.Manufacturer.DisplayValue);
            }

            message.setPublicationDate(
              new Date(contentInfo.PublicationDate.DisplayValue)
            );

            // tags
            if (
              contentInfo.Languages != undefined &&
              contentInfo.Languages.DisplayValues != undefined &&
              contentInfo.Languages.DisplayValues.length > 0
            ) {
              const language: string =
                contentInfo.Languages.DisplayValues[0].DisplayValue.toLowerCase();

              if (language != I18nUtil.ENGLISH) {
                message.setLanguage(language);
              }
            }

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
