import { URL } from 'url';

import { DateUtil } from '../../util/date-util';
import { SiteResolver } from '../resolver/site-resolver.enum';
import { RandomUtil } from './../../util/random-util';
import { Format } from './format.enum';
import { Source } from './source.enum';

export class Message {
  private static readonly PUBLICATION_DATE_MINIMUM_AGE_DAYS = 0;

  private site: SiteResolver;

  // tags
  private source: Source | null;
  private format: Format;
  private language: string | null;

  // information
  private title: string | null;
  private authors: string[];
  private publisher: string;
  private publicationDate: Date | null;
  private url: URL;

  constructor(site: SiteResolver, url: URL) {
    this.site = site;
    this.source = null;
    this.format = Format.EBOOK;
    this.language = null;
    this.title = null;
    this.authors = [];
    this.publisher = 'Self-Published';
    this.publicationDate = null;
    this.url = url;
  }

  clone(): Message {
    const clone: Message = new Message(this.site, this.url);

    clone.source = this.source;
    clone.format = this.format;
    clone.language = this.language;

    clone.title = this.title;
    clone.authors = this.authors;
    clone.publisher = this.publisher;
    clone.publicationDate = this.publicationDate;

    return clone;
  }

  getSiteName(): string {
    const name: string = SiteResolver[this.site];

    const firstLetter = name[0].toUpperCase();
    const otherLetters = name.substr(1).toLowerCase();

    return firstLetter + otherLetters;
  }

  setSource(source: Source): void {
    this.source = source;
  }

  setFormat(format: Format): void {
    this.format = format;
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  getLanguage(): string | null {
    return this.language;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getTitle(): string | null {
    return this.title;
  }

  addAuthor(author: string): void {
    this.authors.push(author);
  }

  getAuthors(): string[] {
    return this.authors;
  }

  getAuthorsAsString(): string {
    return this.authors.join(', ');
  }

  setPublisher(publisher: string | null | undefined): void {
    if (publisher != null && publisher != undefined) {
      this.publisher = publisher;
    }
  }

  getPublisher(): string | null {
    return this.publisher;
  }

  setPublicationDate(publicationDate: Date): void {
    const now: Date = new Date();
    const allowedRequestDate: Date = DateUtil.addDays(
      publicationDate,
      Message.PUBLICATION_DATE_MINIMUM_AGE_DAYS
    );
    if (now.getTime() >= allowedRequestDate.getTime()) {
      this.publicationDate = publicationDate;
    } else {
      throw (
        'Unable to generate the request. This title is scheduled to be released on ' +
        DateUtil.dateToString(allowedRequestDate) +
        '.' +
        this.getEasterEgg()
      );
    }
  }

  private getEasterEgg(): string {
    const random: number = RandomUtil.getRandom(6);

    return random == 0
      ? ' Wait until then or request now manually to get a free warning.'
      : '';
  }

  private getPublicationDate(): string {
    let result = '';

    if (this.publicationDate != null) {
      result = DateUtil.dateToString(this.publicationDate);
    }

    return result;
  }

  setUrl(url: URL): void {
    this.url = url;
  }

  private toTagsString(addRequest: boolean): string {
    const tags: string[] = [];

    // request
    if (addRequest) {
      tags.push('#request');
    } else {
      tags.push('');
    }

    // source
    if (this.source != null) {
      const source: string = Source[this.source];
      tags.push(source.toLowerCase());
    }

    // format
    if (this.format != null) {
      const format: string = Format[this.format];
      tags.push(format.toLowerCase());
    }

    // language
    if (this.language != null) {
      tags.push(this.language);
    }

    return tags.join(' #');
  }

  getLink(): string {
    return this.url.toString();
  }

  toString(): string {
    let message = '';

    // tags
    message += '#request';

    message += '\n\n';

    // info
    message += '<code>' + this.title + '</code>' + '\n';
    message += '<code>' + this.getAuthorsAsString() + '</code>' + '\n';
    message += '<i>' + this.publisher + '</i> ';
    if (this.publicationDate != null) {
      message += '(' + this.getPublicationDate() + ')';
    }
    message += '\n\n';
    message +=
      '<a href="' +
      this.url.toString() +
      '">' +
      this.getSiteName() +
      ' Link</a>';

    message += '\n\n';
    // tags
    message += this.toTagsString(false);

    return message;
  }

  toTileString(): string {
    return this.toTagsString(false);
  }

  toDetailsString(): string {
    return this.title as string;
  }

  toTagString(): string {
    const format: string = Format[this.format];
    return format.toLowerCase();
  }
}
