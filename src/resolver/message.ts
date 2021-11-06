import { SiteResolver } from './site-resolver.enum';

export class Message {
  public static readonly AUDIOBOOK_TAG = 'audiobook';

  private site: SiteResolver;
  private tags: string[];
  private title: string | null;
  private author: string | null;
  private publisher: string;
  private url: string | null;

  constructor(site: SiteResolver) {
    this.site = site;
    this.tags = ['request'];
    this.title = null;
    this.author = null;
    this.publisher = 'Self-Published';
    this.url = null;
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

  setUrl(url: string) {
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
    message += '<i>' + this.publisher + '</i>' + '\n\n';
    message += '<a href="' + this.url + '">' + this.getSiteName() + ' Link</a>';

    return message;
  }

  toTileString(): string {
    return this.toTagsString(1);
  }

  toDetailsString(): string {
    return this.title as string;
  }
}
