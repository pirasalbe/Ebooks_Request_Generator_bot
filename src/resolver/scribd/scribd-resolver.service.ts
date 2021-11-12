import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { AbstractResolver } from '../abstract-resolver';
import { HtmlUtil } from '../html/html-util';
import { NullableHtmlElement } from '../html/nullable-html-element';
import { Message } from '../message';
import { I18nUtil } from './../../i18n/i18n-util';
import { SiteResolver } from './../site-resolver.enum';
import {
  ScribdAdditionalInformationWrapper,
  ScribdAlternativeInformation,
  ScribdInformation,
  ScribdInformationI18n,
  ScribdInformationWrapper,
  ScribdLanguage,
} from './scribd-information';

export class ScribdResolverService extends AbstractResolver {
  private static readonly CONTENT_ID = 'script[type="application/ld+json"]';
  private static readonly ALTERNATIVE_CONTENT_ID =
    'script[data-hypernova-key="contentpreview"]';

  constructor() {
    super();
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const content: HTMLElement[] = html.querySelectorAll(
        ScribdResolverService.CONTENT_ID
      );

      const additionalContent: NullableHtmlElement = html.querySelector(
        ScribdResolverService.ALTERNATIVE_CONTENT_ID
      );

      this.checkRequiredElements([additionalContent]);

      let information: ScribdInformation | null = null;

      // check main content
      if (content.length > 0) {
        information = this.getScribdInformation(content);
      }

      // otherwise get from alternative
      const informationI18n: ScribdInformationI18n =
        this.getScribdAdditionalInformation(additionalContent as HTMLElement);

      const languages: ScribdLanguage[] = informationI18n.languages;

      // no information found
      if (information == null) {
        information = informationI18n.information;
      }

      // prepare message
      const message: Message = new Message(SiteResolver.SCRIBD, url);

      // main info
      message.setTitle(information.name);

      message.setAuthor(information.author);

      message.setPublisher(information.publisher);

      message.setPublicationDate(new Date(information.datePublished));

      // tags
      message.addTag('scribd');
      if (information['@type'] === 'Audiobook') {
        message.addTag(Message.AUDIOBOOK_TAG);
      }

      this.setLanguage(message, information.inLanguage, languages);

      resolve([message]);
    });
  }

  private getScribdInformation(
    content: HTMLElement[]
  ): ScribdInformation | null {
    let information: ScribdInformation | null = null;

    for (let i = 0; i < content.length && information == null; i++) {
      const contentString = HtmlUtil.getRawText(content[i]);

      const wrapper: ScribdInformationWrapper = JSON.parse(contentString);

      for (
        let k = 0;
        k < wrapper['@graph'].length && information == null;
        k++
      ) {
        const tempInformation: ScribdInformation = wrapper['@graph'][k];
        if (
          tempInformation['@type'] === 'Book' ||
          tempInformation['@type'] === 'Audiobook'
        ) {
          information = tempInformation;
        }
      }
    }

    return information;
  }

  private getScribdAdditionalInformation(
    contentElement: HTMLElement
  ): ScribdInformationI18n {
    let information: ScribdAlternativeInformation | null = null;

    const contentString = HtmlUtil.getRawText(contentElement);

    const content: ScribdAdditionalInformationWrapper = JSON.parse(
      this.sanitizeContentString(contentString)
    );

    if (
      content != undefined &&
      content.contentItem != undefined &&
      content.contentItem.title != undefined
    ) {
      information = content.contentItem;
    } else {
      throw 'Error parsing page. Cannot get scribd information.';
    }

    if (
      information.contentType !== 'book' &&
      information.contentType !== 'audiobook'
    ) {
      throw 'The product is neither an ebook nor an audiobook.';
    }

    return {
      information: {
        '@type': information.contentType === 'book' ? 'Book' : 'Audiobook',
        name: information.title,
        inLanguage: I18nUtil.ENGLISH,
        author: information.author.name,
        publisher: information.publisher.name,
        datePublished: information.releaseDate,
      },
      languages: content.i18n.languages,
    };
  }

  private sanitizeContentString(content: string): string {
    return content.replace('<!--', '').replace('-->', '');
  }

  private setLanguage(
    message: Message,
    inLanguage: string,
    languages: ScribdLanguage[]
  ): void {
    if (inLanguage !== '') {
      const languageFound: ScribdLanguage | undefined = languages.find(
        (l: ScribdLanguage) => l.prefix === inLanguage
      );

      if (languageFound != undefined) {
        const language: string = languageFound.name.toLowerCase();
        if (this.isLanguageTagRequired(language)) {
          message.addTag(language);
        }
      }
    }
  }
}
