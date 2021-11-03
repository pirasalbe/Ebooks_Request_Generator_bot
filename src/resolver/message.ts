
export class Message {
  public static readonly AUDIOBOOK_TAG = 'audiobook';

  public static tags: string[]; //made it public to display request type in the inline preview
  public static title: string | null; //made it public to display title in the inline preview
  private author: string | null;
  private publisher: string;
  private url: string | null;

  constructor() {
    Message.tags = ['ebook']; //Bookcrush requires #ebook tag
    Message.title = null;
    this.author = null;
    this.publisher = 'Self-Published';
    this.url = null;
  }

  addTag(tag: string): void {
    Message.tags.pop()
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
    let tags = '';

    message += '#request'

    message += '\n\n';

    // Bookcrush format
    message += '<code>' + Message.title + '</code>' + '\n';
    message += '<code>' + this.author + '</code>' + '\n';
    message += '<i>' + this.publisher + '</i>' + '\n\n';
    message += '<a href = "' + this.url + '">Link</a>';
    
    message += '\n\n';
    // tags
    for (let i = 0; i < Message.tags.length; i++) {
      if (i > 0) {
        message += '';
      }
      if (Message.tags[i] != "request") {
        tags += '#' + Message.tags[i] + ' ';
      }
    }

    message += tags

    return message;
  }
}
