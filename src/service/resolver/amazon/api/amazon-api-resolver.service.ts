import * as SDK from 'paapi5-typescript-sdk';
import { URL } from 'url';

import { AmazonApiException } from '../../../../model/error/amazon/amazon-api-exception';
import { SiteResolver } from '../../../../model/resolver/site-resolver.enum';
import { Message } from '../../../../model/telegram/message';
import { Resolver } from '../../resolver';
import { I18nUtil } from './../../../../util/i18n-util';
import { AmazonApiService } from './amazon-api.service';

export class AmazonApiResolverService implements Resolver {
  private static readonly ASIN_PATTERN: RegExp = new RegExp(
    '^([A-Z]|[0-9]){10}$'
  );
  private static readonly KINDLE_FORMAT: string = 'Kindle eBook';

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
            const itemInfo: SDK.ItemInfo = item.ItemInfo as SDK.ItemInfo;
            const technicalInfo: SDK.TechnicalInfo =
              itemInfo.TechnicalInfo as SDK.TechnicalInfo;

            if (
              itemInfo.TechnicalInfo == undefined ||
              technicalInfo.Formats.DisplayValues.find(
                (d) =>
                  d.DisplayValue == AmazonApiResolverService.KINDLE_FORMAT ||
                  (d as unknown as string) ==
                    AmazonApiResolverService.KINDLE_FORMAT
              ) == undefined
            ) {
              throw 'Provided link is not of a Kindle Edition. Make sure to copy the kindle edition link from amazon.';
            }

            // prepare message
            const message: Message = new Message(
              SiteResolver.AMAZON,
              new URL(item.DetailPageURL)
            );

            // main info
            const title: SDK.Title = itemInfo.Title as SDK.Title;
            const lineInfo: SDK.ByLineInfo =
              itemInfo.ByLineInfo as SDK.ByLineInfo;
            const contentInfo: SDK.ContentInfo =
              itemInfo.ContentInfo as SDK.ContentInfo;

            message.setTitle(title.DisplayValue);

            if (
              lineInfo.Contributors != undefined &&
              lineInfo.Contributors.length > 0
            ) {
              for (const contributor of lineInfo.Contributors) {
                if (contributor.RoleType == SDK.RoleType.AUTHOR) {
                  message.addAuthor(this.fixAuthorName(contributor.Name));
                }
              }
            } else {
              message.addAuthor('No author');
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

            // TODO KU

            resolve([message]);
          })
          .catch((error: any) => reject(error))
      );
    } else {
      const amazonApiException: AmazonApiException = {
        message: 'ItemId not found, cannot use the PAAPI5',
        errors: [],
      };
      result = Promise.reject(amazonApiException);
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
