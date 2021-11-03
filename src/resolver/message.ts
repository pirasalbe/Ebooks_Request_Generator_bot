export class Message {
  public static readonly AUDIOBOOK_TAG = 'audiobook';

  public static tags: string[]; //made it public to display request type in the inline preview
  public static title: string | null; //made it public to display title in the inline preview
  private author: string | null;
  private publisher: string;
  private url: string | null;

  constructor() {
    Message.tags = ['request'];
    Message.title = null;
    this.author = null;
    this.publisher = 'Self-Published';
    this.url = null;
  }

  addTag(tag: string): void {
    Message.tags.push(tag);
  }

  setTitle(title: string) {
    Message.title = title;
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
    for (let i = 0; i < Message.tags.length; i++) {
      if (i > 0) {
        message += ' ';
      }
      message += '#' + Message.tags[i];
    }

    message += '\n\n';

    // info
    // Bookcrush format
    message += 'Title: <code>' + Message.title + '</code>' + '\n';
    message += 'Author: <code>' + this.author + '</code>' + '\n';
    message += 'Publisher: <i>' + this.publisher + '</i>' + '\n\n';
    message += '<a href = "' + this.url + '">Link</a>';

    return message;
  }
}
