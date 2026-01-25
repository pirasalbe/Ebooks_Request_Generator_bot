import { URL } from 'url';
import { HttpUtil } from '../../../../util/http-util';
import { AmazonSiteStripeResponse } from './../../../../model/resolver/amazon/amazon-api';

export class AmazonApiService {
  private static readonly SITESTRIPE_URL: string =
    'https://www.amazon.com/associates/sitestripe/getShortUrl';
  private static readonly SITESTRIPE_LONG_URL: string = 'longUrl';
  private static readonly SITESTRIPE_MARKETPLACE_ID: string = 'marketplaceId';

  private sitestripeMarketplaceId: string | undefined;
  private sitestripeLongUrlParams: string;
  private sitestripeCookies: string | undefined;

  constructor(
    sitestripeMarketplaceId: string | undefined,
    sitestripeLongUrlParams: string | undefined,
    sitestripeCookies: string | undefined
  ) {
    this.sitestripeMarketplaceId = sitestripeMarketplaceId;
    if (sitestripeLongUrlParams != undefined) {
      this.sitestripeLongUrlParams = sitestripeLongUrlParams;
    } else {
      this.sitestripeLongUrlParams = '';
    }
    this.sitestripeCookies = sitestripeCookies;
  }

  getSiteStripeParams(): string {
    return this.sitestripeLongUrlParams;
  }

  siteStripe(longUrl: URL): Promise<string> {
    longUrl.search = this.getSiteStripeParams();
    const longUrlString: string = longUrl.toString();
    let promise: Promise<string>;

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
        HttpUtil.fetch<string>(requestUrl, {
          headers: this.getRequestHeader(this.sitestripeCookies as string),
        })
          .then((response) => {
            if (response.status == 200) {
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
                    console.error(requestUrl.toString(), JSON.stringify(data));
                    resolve(longUrlString);
                  }
                })
                .catch((error) => {
                  console.error('Error', error);
                  resolve(longUrlString);
                });
            } else {
              console.error('Error ' + response.status);
              resolve(longUrlString);
            }
          })
          .catch((err) => {
            console.error(
              'Error connecting to the API',
              requestUrl.toString(),
              err
            );
            resolve(longUrlString);
          });
      });
    } else {
      promise = Promise.resolve(longUrlString);
    }

    return promise;
  }

  private getRequestHeader(cookies: string): Record<string, string> {
    return {
      'User-Agent': HttpUtil.USER_AGENT,
      'Content-Type': 'application/json',
      Accept: HttpUtil.ACCEPT,
      'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
      Cookie: cookies,
    };
  }
}
