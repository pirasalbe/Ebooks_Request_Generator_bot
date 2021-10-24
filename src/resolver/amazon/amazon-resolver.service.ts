import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';

export class AmazonResolverService extends AbstractResolver {
  private static readonly DETAILS_ID = '#detailBullets_feature_div';

  extractMessage(html: HTMLElement): string {
    let message = 'Error parsing page';

    const details: HTMLElement | null = html.querySelector(
      AmazonResolverService.DETAILS_ID
    );

    if (details !== null) {
      // TODO extract info
      console.log(details);
    }

    return message;
  }
}
