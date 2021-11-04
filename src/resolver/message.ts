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
    let site = '';
    // tags
    for (let i = 0; i < this.tags.length; i++) {
      if (i > 0) {
        message += ' ';
      }
      message += '#' + this.tags[i];
    }

    message += '\n\n';
    
    if(this.url?.includes("amazon")) {
      site = "Amazon"
    }
    else if(this.url?.includes("audible")) {
      site = "Audible"
    }
    else if(this.url?.includes("scribd")) {
      site = "Scribd"
    }
    else if(this.url?.includes("storytel")) {
      site = "Storytel"
    }

    // info
    message += '<code>' + this.title + '</code>' + '\n';
    message += '<code>' + this.author + '</code>' + '\n';
    message += '<i>' + this.publisher + '</i>' + '\n\n';
    message += '<a href="' + this.url + `">${site} Link</a>`;

    return message;
  }

  toSmallString(): string {
    return this.title as string;
  }
}
