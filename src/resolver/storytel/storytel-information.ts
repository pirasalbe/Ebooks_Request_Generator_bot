import { I18nUtil } from './../../i18n/i18n-util';

export type StorytelElement = {
  '@type': 'Audiobook' | 'Book' | 'Organization';
};

export type StorytelInformation = StorytelElement & {
  bookFormat: 'AudiobookFormat' | 'EBook';
  name: string;
  author: StorytelAuthor[];
  publisher: StorytelPublisher;
  inLanguage: string;
};

export class StorytelInformationWrapper {
  private book: StorytelInformation;
  private audiobook: StorytelInformation;
  private organization: StorytelOrganization;

  constructor(
    book: StorytelInformation,
    audiobook: StorytelInformation,
    organization: StorytelOrganization
  ) {
    this.book = book;
    this.audiobook = audiobook;
    this.organization = organization;
  }

  getTitle(): string {
    return this.audiobook.name;
  }

  getAuthor(): string {
    return this.audiobook.author.map((a: StorytelAuthor) => a.name).join(', ');
  }

  getPublisher(): string | null {
    let publisher: string | null;

    if (this.audiobook.publisher.name != '') {
      publisher = this.audiobook.publisher.name;
    } else {
      publisher = this.book.publisher.name;
    }

    return publisher;
  }

  getLanguageCode(): string {
    return this.audiobook.inLanguage;
  }

  getLanguage(): string {
    let language: string | undefined;

    const code = this.getLanguageCode().toUpperCase();

    const contactPoint: StorytelOrganizationContactPoint | undefined =
      this.organization.contactPoint.find(
        (c: StorytelOrganizationContactPoint) =>
          c.areaServed == code && c.availableLanguage.length > 0
      );

    if (contactPoint != undefined) {
      language = contactPoint.availableLanguage.find(
        (l: string) =>
          contactPoint.availableLanguage.length == 1 ||
          l.toLowerCase() != I18nUtil.ENGLISH
      );
    }

    if (language == undefined) {
      language = I18nUtil.ENGLISH;
    }

    return language.toLowerCase();
  }
}

export type StorytelOrganization = StorytelElement & {
  name: 'Storytel';
  contactPoint: StorytelOrganizationContactPoint[];
};

export type StorytelOrganizationContactPoint = {
  areaServed: string;
  availableLanguage: string[];
};

export type StorytelAuthor = {
  name: string;
};

export type StorytelPublisher = {
  name: string;
};
