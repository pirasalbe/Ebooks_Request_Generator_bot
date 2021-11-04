export class Message {
  public static readonly AUDIOBOOK_TAG = 'audiobook';

  private tags: string[];
  private title: string | null;
  private author: string | null;
  private publisher: string;
  private url: string | null;

  constructor() {
    this.tags = ['request'];
    this.title = null;
    this.author = null;
    this.publisher = 'Self-Published';
    this.url = null;
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

  toString(): string {
    let message = '';

    // tags
    for (let i = 0; i < this.tags.length; i++) {
      if (i > 0) {
        message += ' ';
      }
      message += '#' + this.tags[i];
    }

    message += '\n\n';

    // info
    // Bookcrush format
    message += 'Title: <code>' + this.title + '</code>' + '\n';
    message += 'Author: <code>' + this.author + '</code>' + '\n';
    message += 'Publisher: <i>' + this.publisher + '</i>' + '\n\n';
    message += '<a href="' + this.url + '">Link</a>';

    return message;
  }

  toSmallString(): string {
    return this.title as string;
  }
}
