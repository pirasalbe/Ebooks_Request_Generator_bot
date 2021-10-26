export class Message {
  private tags: string[];
  private title: string | null;
  private author: string | null;
  private publisher: string;
  private url: string | null;

  constructor() {
    this.tags = ['request'];
    this.title = null;
    this.author = null;
    this.publisher = 'Self Published';
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

  setPublisher(publisher: string) {
    this.publisher = publisher;
  }

  setUrl(url: string) {
    this.url = url;
  }

  toString(): string {
    let message: string = '';

    // tags
    for (let i = 0; i < this.tags.length; i++) {
      if (i > 0) {
        message += ' ';
      }
      message += '#' + this.tags[i];
    }

    message += '\n';

    // info
    message += 'Title: ' + this.title + '\n';
    message += 'Author: ' + this.author + '\n';
    message += 'Publisher: ' + this.publisher + '\n';
    message += this.url;

    return message;
  }
}
