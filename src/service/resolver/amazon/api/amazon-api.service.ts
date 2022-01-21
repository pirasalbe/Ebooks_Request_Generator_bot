import { AmazonApiException } from './../../../../model/error/amazon/amazon-api-exception';
import { AmazonSiteStripeResponse } from './../../../../model/resolver/amazon/amazon-api';
import * as http from 'http';
import { OutgoingHttpHeaders } from 'http';
import * as https from 'https';
import { URL } from 'url';
import { HttpUtil } from '../../../../util/http-util';
import * as SDK from 'paapi5-typescript-sdk';

export class AmazonApiService {
  private static readonly SITESTRIPE_URL: string =
    'https://www.amazon.com/associates/sitestripe/getShortUrl';
  private static readonly SITESTRIPE_LONG_URL: string = 'longUrl';
  private static readonly SITESTRIPE_MARKETPLACE_ID: string = 'marketplaceId';

  private sitestripeMarketplaceId: string | undefined;
  private sitestripeLongUrlParams: string;
  private sitestripeCookies: string | undefined;

  private accessKey: string | undefined;
  private secretKey: string | undefined;
  private partnerTag: string | undefined;

  constructor(
    accessKey: string | undefined,
    secretKey: string | undefined,
    partnerTag: string | undefined,
    sitestripeMarketplaceId: string | undefined,
    sitestripeLongUrlParams: string | undefined,
    sitestripeCookies: string | undefined
  ) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.partnerTag = partnerTag;

    this.sitestripeMarketplaceId = sitestripeMarketplaceId;
    if (sitestripeLongUrlParams != undefined) {
      this.sitestripeLongUrlParams = sitestripeLongUrlParams;
    } else {
      this.sitestripeLongUrlParams = '';
    }
    this.sitestripeCookies = sitestripeCookies;
  }

  siteStripe(longUrl: URL): Promise<string> {
    longUrl.search = this.sitestripeLongUrlParams;
    const longUrlString: string = longUrl.toString();
    let promise: Promise<string> = Promise.resolve(longUrlString);

    if (
      this.sitestripeMarketplaceId != undefined &&
      this.sitestripeCookies != undefined
    ) {
      const requestUrl: URL = new URL(AmazonApiService.SITESTRIPE_URL);
      requestUrl.searchParams.set(
        AmazonApiService.SITESTRIPE_LONG_URL,
        longUrl.toString()
      );
      requestUrl.searchParams.set(
        AmazonApiService.SITESTRIPE_MARKETPLACE_ID,
        this.sitestripeMarketplaceId
      );

      promise = new Promise<string>((resolve) => {
        https
          .get(
            requestUrl,
            {
              headers: this.getRequestHeader(this.sitestripeCookies as string),
            },
            (response: http.IncomingMessage) => {
              if (response.statusCode == 200) {
                HttpUtil.processSuccessfulResponse(response, (data: string) => {
                  const info: AmazonSiteStripeResponse = JSON.parse(
                    data
                  ) as AmazonSiteStripeResponse;
                  return Promise.resolve(info);
                })
                  .then((data: AmazonSiteStripeResponse) => {
                    if (data.isOk && data.shortUrl != null) {
                      resolve(data.shortUrl);
                    } else {
                      console.error(
                        requestUrl.toString(),
                        JSON.stringify(data)
                      );
                      resolve(longUrlString);
                    }
                  })
                  .catch((error) => {
                    console.error('Error', error);
                    resolve(longUrlString);
                  });
              } else {
                console.error('Error ' + response.statusCode);
                resolve(longUrlString);
              }
            }
          )
          .on('timeout', () => {
            console.error('Connection timed out');
            resolve(longUrlString);
          })
          .on('error', (err: Error) => {
            console.error('Error connecting to the API', err.message);
            resolve(longUrlString);
          });
      });
    }

    return promise;
  }

  private getRequestHeader(cookies: string): OutgoingHttpHeaders {
    return {
      'User-Agent': HttpUtil.USER_AGENT,
      'Content-Type': 'application/json',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
      Cookie: cookies,
    };
  }

  getItemsRequest(itemId: string): Promise<SDK.Item> {
    let result: Promise<SDK.Item>;

    if (
      this.accessKey != undefined &&
      this.secretKey &&
      this.partnerTag != undefined
    ) {
      const request: SDK.GetItemsRequest = new SDK.GetItemsRequest(
        {
          ItemIds: [itemId],
          Resources: [
            'ItemInfo.Title',
            'ItemInfo.ByLineInfo',
            'ItemInfo.ContentInfo',
            'ItemInfo.ManufactureInfo',
            'ItemInfo.ProductInfo',
            'ItemInfo.TechnicalInfo',
          ],
        },
        this.partnerTag,
        SDK.PartnerType.ASSOCIATES,
        this.accessKey,
        this.secretKey,
        SDK.Host.UNITED_STATES,
        SDK.Region.UNITED_STATES
      );

      result = new Promise<SDK.Item>((resolve, reject) => {
        request
          .send()
          .then((response: SDK.GetItemsResponse) => {
            if (
              response.Errors == undefined &&
              response.ItemsResult != undefined &&
              response.ItemsResult.Items.length > 0
            ) {
              resolve(response.ItemsResult.Items[0]);
            } else {
              const errorMessage = response.Errors.map(
                (error) => error.Message
              ).join(', ');
              console.error('PAAPI5 error', errorMessage, response.Errors);
              const amazonApiException: AmazonApiException = {
                message: errorMessage,
                errors: response.Errors,
              };
              reject(amazonApiException);
            }
          })
          .catch((error: any) => {
            console.error('There was an error connecting to the PAAPI5', error);
            const amazonApiException: AmazonApiException = {
              message: 'There was an error connecting to the PAAPI5',
              errors: [],
            };
            reject(amazonApiException);
          });
      });
    } else {
      const amazonApiException: AmazonApiException = {
        message: 'Amazon PAAPI5 are disabled',
        errors: [],
      };
      result = Promise.reject(amazonApiException);
    }

    return result;
  }
}
