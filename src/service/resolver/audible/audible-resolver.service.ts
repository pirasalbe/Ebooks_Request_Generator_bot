import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import { AudibleInformation } from '../../../model/resolver/audible-information';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import { Message } from '../../../model/telegram/message';
import { HtmlUtil } from '../../../util/html-util';
import { AbstractResolver } from '../abstract-resolver';
import { Format } from './../../../model/telegram/format.enum';
import { StatisticsService } from './../../statistics/statistic.service';

export class AudibleResolverService extends AbstractResolver {
  private static readonly OVERRIDE_LANGUAGE = 'ipRedirectOverride';
  private static readonly BOTTOM_ID = '#bottom-0';
  private static readonly SCRIPT_ID = 'script';

  constructor(statisticsService: StatisticsService) {
    super(statisticsService);
  }

  prepareUrl(url: URL): URL {
    url = super.prepareUrl(url);

    // add override to avoid redirection
    url.searchParams.set(AudibleResolverService.OVERRIDE_LANGUAGE, 'true');

    return url;
  }

  protected getRedirectURL(originalUrl: URL, newLocation: string): URL {
    const newUrl: URL = new URL(originalUrl.toString());

    newUrl.pathname = newLocation.split('?')[0];

    return newUrl;
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const bottom: NullableHtmlElement = html.querySelector(
        AudibleResolverService.BOTTOM_ID
      );

      this.checkRequiredElements([bottom]);

      const information: AudibleInformation = this.getAudibleInformation(
        bottom as HTMLElement
      );

      // prepare message
      const message: Message = new Message(SiteResolver.AUDIBLE, url);

      // main info
      message.setTitle(information.name);

      for (const author of information.author) {
        message.addAuthor(author.name);
      }

      message.setPublisher(information.publisher);

      message.setPublicationDate(new Date(information.datePublished));

      // tags
      message.setFormat(Format.AUDIOBOOK);

      if (this.isLanguageTagRequired(information.inLanguage)) {
        message.setLanguage(information.inLanguage);
      }

      resolve([message]);
    });
  }

  private getAudibleInformation(bottom: HTMLElement): AudibleInformation {
    const scripts: HTMLElement[] = (bottom as HTMLElement).querySelectorAll(
      AudibleResolverService.SCRIPT_ID
    );

    let information: AudibleInformation | null = null;

    for (let i = 0; i < scripts.length && information == null; i++) {
      const script = scripts[i];
      const contentString = HtmlUtil.getRawText(script);

      const content: any[] = JSON.parse(contentString);
      for (let i = 0; i < content.length; i++) {
        const obj = content[i] as AudibleInformation;
        if (
          obj['@type'] != null &&
          (obj['@type'] == 'Audiobook' || obj['@type'] == 'PodcastSeries')
        ) {
          information = obj;
        }
      }
    }

    if (information == null) {
      throw 'Error parsing page. Cannot get audiobook information.';
    }

    return information;
  }
}
