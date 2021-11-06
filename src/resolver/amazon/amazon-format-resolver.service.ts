import * as http from 'http';
import * as https from 'https';
import { HTMLElement } from 'node-html-parser';

import { HtmlUtil } from '../html/html-util';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { HttpUtil } from '../http/http-util';

export class AmazonFormatResolverService {
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';

  private static readonly PLACEHOLDER = 'PLACEHOLDER';
  private static readonly FORMATS_ID =
    '[data-card-metrics-id="morpheus-popularity-rank-sidesheet-card_DetailPage_' +
    AmazonFormatResolverService.PLACEHOLDER +
    '"]';

  private static readonly KINDLE_ID = 'div[data-a-name="kindle_meta_binding"]';
  private static readonly ASIN_ID =
    'input[type="hidden"][value="' +
    AmazonFormatResolverService.PLACEHOLDER +
    '"]';

  private static readonly FORMAT_URL =
    'https://www.amazon.COM/acp/morpheus-popularity-rank-sidesheet-card/tmips-psvsypciab/getSidesheetHtml?';
  private static readonly ACP_PARAMS_ATTRIBUTE = 'data-acp-params';

  isKindleUnlimited(asin: string, html: HTMLElement): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.existsKindleUnlimitedElement(html)) {
        resolve(true);
      } else {
        // request format
        const formats: NullableHtmlElement = this.findFormatsWrapper(html);

        let acpParams: string | undefined = undefined;

        if (formats != null) {
          acpParams = formats.getAttribute(
            AmazonFormatResolverService.ACP_PARAMS_ATTRIBUTE
          );
        }

        if (acpParams != undefined) {
          this.getFormats(acpParams, asin)
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
              reject(error);
            });
        } else {
          console.error(asin, acpParams);
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

  private getEbookElement(
    asin: string,
    html: HTMLElement
  ): NullableHtmlElement {
    let ebookElement: NullableHtmlElement = null;
    let asinElement: NullableHtmlElement = null;

    const kindleElement: NullableHtmlElement = html.querySelector(
      AmazonFormatResolverService.KINDLE_ID
    );

    if (kindleElement != null) {
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
