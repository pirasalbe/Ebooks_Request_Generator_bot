import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';

export class AmazonResolverService extends AbstractResolver {
  private static readonly TITLE_ID = '#productTitle';
  private static readonly KINDLE_FORMAT_ID = '#productSubtitle';
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';
  private static readonly DETAILS_ID = '#detailBullets_feature_div';

  private static readonly KINDLE = 'kindle';

  extractMessage(html: HTMLElement): string {
    let message = 'Error parsing page';

    const title: HTMLElement | null = html.querySelector(
      AmazonResolverService.TITLE_ID
    );

    const kindleFormat: HTMLElement | null = html.querySelector(
      AmazonResolverService.KINDLE_FORMAT_ID
    );

    const details: HTMLElement | null = html.querySelector(
      AmazonResolverService.DETAILS_ID
    );

    // parse page only if the elements exists
    if (title != null && details !== null) {
      this.checkKindleFormat(kindleFormat);

      // tags
      message = this.getTags(html);

      message += '\n';

      message += 'Title: ' + title.textContent.trim();
      // TODO extract info
      // console.log(details);
    }

    return message;
  }

  private checkKindleFormat(format: HTMLElement | null): void {
    if (
      format == null ||
      format.textContent == null ||
      !format.textContent
        .toLocaleLowerCase()
        .includes(AmazonResolverService.KINDLE)
    ) {
      throw 'The product is not a kindle book';
    }
  }

  private getTags(html: HTMLElement): string {
    let tags = '#request';

    const kindleUnlimited: HTMLElement | null = html.querySelector(
      AmazonResolverService.KINDLE_UNLIMITED_ID
    );

    if (kindleUnlimited != null) {
      tags += ' #KU';
    }

    return tags;
  }
}
