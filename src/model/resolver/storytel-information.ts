import { I18nUtil } from '../../util/i18n-util';

export enum StorytelFormat {
  EBOOK,
  AUDIOBOOK,
  BOTH,
}

export type StorytelElement = {
  '@type': 'Audiobook' | 'Book' | 'Organization';
};

export type StorytelInformation = StorytelElement & {
  bookFormat: 'AudiobookFormat' | 'EBook';
  name: string;
  author: StorytelAuthor[];
  publisher: StorytelPublisher;
  datePublished: string;
  inLanguage: string;
};

export type StorytelAuthor = {
  name: string;
};

export type StorytelPublisher = {
  name: string;
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

  getAuthors(): string[] {
    return this.audiobook.author.map((a: StorytelAuthor) => a.name);
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

  getDatePublished(): string | null {
    let datePublished: string | null;

    if (this.audiobook.datePublished != '') {
      datePublished = this.audiobook.datePublished;
    } else {
      datePublished = this.book.datePublished;
    }

    return datePublished;
  }

  getLanguageCode(): string {
    return this.audiobook.inLanguage;
  }

  getLanguage(): string | null {
    let language: string | null = null;

    const code = this.getLanguageCode().toUpperCase();

    const contactPoint: StorytelOrganizationContactPoint | undefined =
      this.organization.contactPoint.find(
        (c: StorytelOrganizationContactPoint) =>
          c.areaServed == code && c.availableLanguage.length > 0
      );

    let contactPointLanguage: string | undefined;
    if (contactPoint != undefined) {
      contactPointLanguage = contactPoint.availableLanguage.find(
        (l: string) =>
          contactPoint.availableLanguage.length == 1 ||
          l.toLowerCase() != I18nUtil.ENGLISH
      );
    }

    if (contactPointLanguage != undefined) {
      language = contactPointLanguage.toLowerCase();
    }

    return language;
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

export type StorytelDetailsWrapper = {
  component: string;
  props: StorytelDetails;
};

export type StorytelDetails = {
  book: StorytelDetailsBook;
  countryIso: string;
  language: string;
};

export type StorytelDetailsBook = {
  language: StorytelDetailsBookLanguage;
  originalTitle: string;
  title: string;
  id: string;
};

export type StorytelDetailsBookLanguage = {
  id: string;
  name: string;
};
