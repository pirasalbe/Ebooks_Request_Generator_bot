import { URL } from 'url';

import { DateUtil } from './../util/date-util';
import { SiteResolver } from './site-resolver.enum';

export class Message {
  public static readonly AUDIOBOOK_TAG = 'audiobook';
  private static readonly PUBLICATION_DATE_MINIMUM_AGE_DAYS = 0;

  private site: SiteResolver;
  private tags: string[];
  private title: string | null;
  private author: string | null;
  private publisher: string;
  private publicationDate: Date | null;
  private url: URL;

  constructor(site: SiteResolver, url: URL) {
    this.site = site;
    this.tags = ['request'];
    this.title = null;
    this.author = null;
    this.publisher = 'Self-Published';
    this.publicationDate = null;
    this.url = url;
  }

  clone(): Message {
    const clone: Message = new Message(this.site, this.url);

    clone.tags = [];
    for (const tag of this.tags) {
      clone.tags.push(tag);
    }

    clone.title = this.title;
    clone.author = this.author;
    clone.publisher = this.publisher;

    return clone;
  }

  private getSiteName(): string {
    const name: string = SiteResolver[this.site];

    const firstLetter = name[0].toUpperCase();
    const otherLetters = name.substr(1).toLowerCase();

    return firstLetter + otherLetters;
  }

  addTag(tag: string): void {
    this.tags.push(tag);
  }

  setTitle(title: string) {
    this.title = title;
  }

  setAuthor(author: string) {
    this.author = author;
  }

  setPublisher(publisher: string | null | undefined) {
    if (publisher != null && publisher != undefined) {
      this.publisher = publisher;
    }
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
        'Cannot generate the request. Wait until ' +
        DateUtil.dateToString(allowedRequestDate) +
        '.'
      );
    }
  }

  private getPublicationDate(): string {
    let result = '';

    if (this.publicationDate != null) {
      result = DateUtil.dateToString(this.publicationDate);
    }

    return result;
  }

  setUrl(url: URL) {
    this.url = url;
  }

  private toTagsString(start = 0): string {
    let tags = '';

    for (let i = start; i < this.tags.length; i++) {
      if (i > start) {
        tags += ' ';
      }
      tags += '#' + this.tags[i];
    }

    return tags;
  }

  toString(): string {
    let message = '';

    // tags
    message += this.toTagsString();

    message += '\n\n';

    // info
    message += '<code>' + this.title + '</code>' + '\n';
    message += '<code>' + this.author + '</code>' + '\n';
    message += '<i>' + this.publisher + '</i> ';
    message += '(' + this.getPublicationDate() + ')' + '\n\n';
    message +=
      '<a href="' +
      this.url.toString() +
      '">' +
      this.getSiteName() +
      ' Link</a>';

    return message;
  }

  toTileString(): string {
    return this.toTagsString(1);
  }

  toDetailsString(): string {
    return this.title as string;
  }
}
