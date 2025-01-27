import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { HtmlUtil } from '../../../util/html-util';
import { HttpUtil } from '../../../util/http-util';

export class AmazonFormatResolverService {
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';

  private static readonly PLACEHOLDER = 'PLACEHOLDER';
  private static readonly FORMATS_ID =
    '[data-card-metrics-id="morpheus-popularity-rank-sidesheet-card_DetailPage_' +
    AmazonFormatResolverService.PLACEHOLDER +
    '"]';

  private static readonly CONTAINERS_ID = '.sidesheetAsinListContainer';
  private static readonly ASIN_ID =
    'input[type="hidden"][value="' +
    AmazonFormatResolverService.PLACEHOLDER +
    '"]';

  private static readonly ACP_PARAMS_ATTRIBUTE = 'data-acp-params';
  private static readonly ACP_PATH_ATTRIBUTE = 'data-acp-path';
  private static readonly FORMAT_RESOURCES = [
    'getPageHTML',
    'getSidesheetHtml',
  ];

  isKindleUnlimited(
    url: URL,
    asin: string,
    html: HTMLElement
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.existsKindleUnlimitedElement(html)) {
        resolve(true);
      } else {
        // request format
        const formats: NullableHtmlElement = this.findFormatsWrapper(html);

        let acpParams: string | undefined = undefined;
        let acpPath: string | undefined = undefined;

        if (formats != null) {
          acpParams = formats.getAttribute(
            AmazonFormatResolverService.ACP_PARAMS_ATTRIBUTE
          );

          acpPath = formats.getAttribute(
            AmazonFormatResolverService.ACP_PATH_ATTRIBUTE
          );
        }

        if (acpParams != undefined && acpPath != undefined) {
          this.getFormatsDetails(url, acpPath, 0, acpParams, asin)
            .then((kindleUnlimited: boolean) => {
              resolve(kindleUnlimited);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          console.error(asin, acpParams, acpPath);
          reject('Missing required elements.');
        }
      }
    });
  }

  private existsKindleUnlimitedElement(parent: HTMLElement): boolean {
    const kindleUnlimited: NullableHtmlElement = parent.querySelector(
      AmazonFormatResolverService.KINDLE_UNLIMITED_ID
    );

    return kindleUnlimited != null;
  }

  private findFormatsWrapper(parent: HTMLElement): NullableHtmlElement {
    let formats: NullableHtmlElement = null;

    for (let i = 0; i < 10 && formats == null; i++) {
      formats = parent.querySelector(
        AmazonFormatResolverService.FORMATS_ID.replace(
          AmazonFormatResolverService.PLACEHOLDER,
          String(i)
        )
      );
    }

    return formats;
  }

  private getFormatsDetails(
    url: URL,
    acpPath: string,
    formatResourceIndex: number,
    acpParams: string,
    asin: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (
        formatResourceIndex >
        AmazonFormatResolverService.FORMAT_RESOURCES.length
      ) {
        reject('Error while resolving format');
      }

      this.getFormats(
        url,
        acpPath,
        AmazonFormatResolverService.FORMAT_RESOURCES[formatResourceIndex],
        acpParams,
        asin
      )
        .then((div: HTMLElement) => {
          const ebookElement: NullableHtmlElement = this.getEbookElement(
            asin,
            div
          );
          if (ebookElement != null) {
            // check kindle unlimited on the right book
            if (this.existsKindleUnlimitedElement(ebookElement)) {
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        })
        .catch((error) => {
          this.getFormatsDetails(
            url,
            acpPath,
            formatResourceIndex + 1,
            acpParams,
            asin
          )
            .then((kindleUnlimited: boolean) => {
              resolve(kindleUnlimited);
            })
            .catch((nextIndexError) => {
              reject([error, nextIndexError].join(' ,'));
            });
        });
    });
  }

  private getFormats(
    url: URL,
    acpPath: string,
    formatResource: string,
    acpParams: string,
    asin: string
  ): Promise<HTMLElement> {
    const requestUrl: URL = new URL(url.toString());
    requestUrl.pathname = acpPath + formatResource;
    requestUrl.search = '';

    return new Promise<HTMLElement>((resolve, reject) => {
      const request: http.ClientRequest = https
        .request(
          requestUrl,
          {
            method: 'POST',
            headers: {
              'User-Agent': HttpUtil.USER_AGENT,
              'Content-Type': 'application/json',
              Accept: '*/*',
              'Accept-Encoding': HttpUtil.ACCEPT_ENCODING,
              'x-amz-acp-params': acpParams,
            },
          },
          (response: http.IncomingMessage) => {
            if (response.statusCode == 200) {
              HttpUtil.processSuccessfulResponse(response, (data: string) => {
                return new Promise<HTMLElement>((resolve) =>
                  resolve(HtmlUtil.parseHTML(data))
                );
              })
                .then((html: HTMLElement) => resolve(html))
                .catch((error) => reject(error));
            } else {
              reject('Error ' + response.statusCode);
            }
          }
        )
        .on('timeout', () => {
          reject('Connection timed out');
        })
        .on('error', (err: Error) => {
          console.error('Error connecting to ', url.toString(), err.message);
          reject('Connection error: ' + err.message);
        });

      // add body and send request
      request.write(
        JSON.stringify({
          asin: asin,
        })
      );
      request.end();
    });
  }

  private getEbookElement(
    asin: string,
    html: HTMLElement
  ): NullableHtmlElement {
    let ebookElement: NullableHtmlElement = null;
    let asinElement: NullableHtmlElement = null;

    const kindleElements: HTMLElement[] = html.querySelectorAll(
      AmazonFormatResolverService.CONTAINERS_ID
    );

    for (let i = 0; i < kindleElements.length && asinElement == null; i++) {
      const kindleElement: HTMLElement = kindleElements[i];

      asinElement = kindleElement.querySelector(
        AmazonFormatResolverService.ASIN_ID.replace(
          AmazonFormatResolverService.PLACEHOLDER,
          asin
        )
      );
    }

    if (asinElement != null) {
      ebookElement = asinElement.parentNode;
    }

    return ebookElement;
  }
}
