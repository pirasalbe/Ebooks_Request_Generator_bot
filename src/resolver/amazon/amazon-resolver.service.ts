import { HTMLElement } from 'node-html-parser';

import { AbstractResolver } from '../abstract-resolver';
import { Message } from './../message';

export class AmazonResolverService extends AbstractResolver {
  private static readonly SITE_LANGUAGE_ID = '.nav-logo-locale';
  private static readonly TITLE_ID = '#productTitle';
  private static readonly AUTHOR_ID = '.contributorNameID';
  private static readonly KINDLE_FORMAT_ID = '#productSubtitle';
  private static readonly KINDLE_UNLIMITED_ID = '.a-icon-kindle-unlimited';
  private static readonly DETAILS_ID = '#detailBullets_feature_div';

  private static readonly KINDLE = 'kindle';

  extractMessage(html: HTMLElement): Message {
    let message: Message = new Message();

    const siteLanguage: HTMLElement | null = html.querySelector(
      AmazonResolverService.SITE_LANGUAGE_ID
    );

    const title: HTMLElement | null = html.querySelector(
      AmazonResolverService.TITLE_ID
    );

    const author: HTMLElement | null = html.querySelector(
      AmazonResolverService.AUTHOR_ID
    );

    const kindleFormat: HTMLElement | null = html.querySelector(
      AmazonResolverService.KINDLE_FORMAT_ID
    );

    const details: HTMLElement | null = html.querySelector(
      AmazonResolverService.DETAILS_ID
    );

    // parse page only if the elements exists
    if (
      siteLanguage != null &&
      title != null &&
      author != null &&
      details !== null
    ) {
      this.checkKindleFormat(kindleFormat);

      // tags
      this.addTags(message, html);

      message.setTitle(this.getTextContent(title));
      message.setAuthor(this.getTextContent(author));
      this.setDetails(message, this.getTextContent(siteLanguage), details);
    } else {
      throw 'Error parsing page';
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

  private addTags(message: Message, html: HTMLElement): void {
    const kindleUnlimited: HTMLElement | null = html.querySelector(
      AmazonResolverService.KINDLE_UNLIMITED_ID
    );

    if (kindleUnlimited != null) {
      message.addTag('KU');
    }
  }

  private setDetails(
    message: Message,
    siteLanguage: string,
    details: HTMLElement
  ): void {
    const ul: HTMLElement[] = details.getElementsByTagName('ul');

    if (ul.length == 1) {
      const li: HTMLElement[] = details.getElementsByTagName('li');

      for (const element of li) {
        // TODO
        /*
        <li><span class="a-list-item">
          <span class="a-text-bold">Publisher
          &rlm;
          :
          &lrm;
          </span>
          <span>Penguin (16 Sept. 2021)</span>
          </span></li>
        */
      }
    } else {
      throw 'Error parsing page';
    }
  }

  private getTextContent(element: HTMLElement): string {
    return element.textContent.trim();
  }
}
