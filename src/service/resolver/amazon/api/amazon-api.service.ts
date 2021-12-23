import { AmazonSiteStripeResponse } from './../../../../model/resolver/amazon/amazon-api';
import * as http from 'http';
import { OutgoingHttpHeaders } from 'http';
import * as https from 'https';
import { URL } from 'url';
import { HttpUtil } from '../../../../util/http-util';

export class AmazonApiResolverService {
  private static readonly SITESTRIPE_URL: string =
    'https://www.amazon.it/associates/sitestripe/getShortUrl';
  private static readonly SITESTRIPE_LONG_URL: string = 'longUrl';
  private static readonly SITESTRIPE_MARKETPLACE_ID: string = 'marketplaceId';

  private sitestripeMarketplaceId: string | undefined;
  private sitestripeCookies: string | undefined;

  constructor(
    sitestripeMarketplaceId: string | undefined,
    sitestripeCookies: string | undefined
  ) {
    this.sitestripeMarketplaceId = sitestripeMarketplaceId;
    this.sitestripeCookies = sitestripeCookies;
  }

  siteStripe(longUrl: URL): Promise<string> {
    const longUrlString: string = longUrl.toString();
    let promise: Promise<string> = Promise.resolve(longUrlString);

    if (
      this.sitestripeMarketplaceId != undefined &&
      this.sitestripeCookies != undefined
    ) {
      const requestUrl: URL = new URL(AmazonApiResolverService.SITESTRIPE_URL);
      longUrl.search = '';
      requestUrl.searchParams.set(
        AmazonApiResolverService.SITESTRIPE_LONG_URL,
        longUrl.toString()
      );
      requestUrl.searchParams.set(
        AmazonApiResolverService.SITESTRIPE_MARKETPLACE_ID,
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
                    if (data.isOk) {
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
}
