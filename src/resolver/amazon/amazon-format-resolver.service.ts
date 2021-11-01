import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';

import { HtmlUtil } from '../html/html-util';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { HttpUtil } from '../http/http-util';

export class AmazonFormatResolverService {
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';

  private static readonly FORMATS_ID_PLACEHOLDER = 'PLACEHOLDER';
  private static readonly FORMATS_ID =
    '[data-card-metrics-id="morpheus-popularity-rank-sidesheet-card_DetailPage_' +
    AmazonFormatResolverService.FORMATS_ID_PLACEHOLDER +
    '"]';
  private static readonly ASIN_ID = '.landingAsinValue';

  private static readonly FORMAT_URL =
    'https://www.amazon.COM/acp/morpheus-popularity-rank-sidesheet-card/tmips-psvsypciab/getSidesheetHtml?';
  private static readonly VALUE_ATTRIBUTE = 'value';
  private static readonly ACP_PARAMS_ATTRIBUTE = 'data-acp-params';

  isKindleUnlimited(html: HTMLElement): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.existsKindleUnlimitedElement(html)) {
        resolve(true);
      } else {
        // request format
        const formats: NullableHtmlElement = this.findFormatsWrapper(html);

        let asin: NullableHtmlElement = null;
        let acpParams: string | undefined = undefined;
        let asinValue: string | undefined = undefined;

        if (formats != null) {
          acpParams = formats.getAttribute(
            AmazonFormatResolverService.ACP_PARAMS_ATTRIBUTE
          );

          asin = formats.querySelector(AmazonFormatResolverService.ASIN_ID);
        }

        if (asin != null) {
          asinValue = asin.getAttribute(
            AmazonFormatResolverService.VALUE_ATTRIBUTE
          );
        }

        if (asinValue != undefined && acpParams != undefined) {
          this.getFormats(acpParams, asinValue)
            .then((div: HTMLElement) => {
              // check kindle unlimited
              if (this.existsKindleUnlimitedElement(div)) {
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          console.error(html, asinValue, acpParams);
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
          AmazonFormatResolverService.FORMATS_ID_PLACEHOLDER,
          String(i)
        )
      );
    }

    return formats;
  }

  private getFormats(acpParams: string, asin: string): Promise<HTMLElement> {
    return new Promise<HTMLElement>((resolve, reject) => {
      const request: http.ClientRequest = https.request(
        AmazonFormatResolverService.FORMAT_URL,
        {
          method: 'POST',
          headers: {
            'User-Agent': HttpUtil.USER_AGENT_VALUE,
            'Content-Type': 'application/json',
            Accept: '*/*',
            'Accept-Encoding': 'compress',
            'x-amz-acp-params': acpParams,
          },
        },
        (response: http.IncomingMessage) => {
          if (response.statusCode == 200) {
            HttpUtil.processSuccessfulResponse(response, (data: string) => {
              return new Promise<HTMLElement>((resolve, reject) =>
                resolve(HtmlUtil.parseHTML(data))
              );
            })
              .then((html: HTMLElement) => resolve(html))
              .catch((error) => reject(error));
          } else {
            reject('Error ' + response.statusCode);
          }
        }
      );

      // add body and send request
      request.write(
        JSON.stringify({
          asin: asin,
        })
      );
      request.end();
    });
  }
}
