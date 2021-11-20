export class AmazonDetails {
  private publisher: string | null;
  private publicationDate: string | null;
  private language: string | null;
  private asin: string | null;

  constructor() {
    this.publisher = null;
    this.publicationDate = null;
    this.language = null;
    this.asin = null;
  }

  isComplete(): boolean {
    return (
      this.publisher != null &&
      this.publicationDate != null &&
      this.language != null &&
      this.asin != null
    );
  }

  setPublisher(publisher: string | null | undefined) {
    if (publisher != null && publisher != undefined) {
      this.publisher = publisher;
    }
  }

  getPublisher(): string | null {
    return this.publisher;
  }

  setPublicationDate(publicationDate: string) {
    this.publicationDate = publicationDate;
  }

  getPublicationDate(): string | null {
    return this.publicationDate;
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  getLanguage(): string | null {
    return this.language;
  }

  hasLanguage(): boolean {
    return this.language != null;
  }

  setAsin(asin: string): void {
    this.asin = asin;
  }

  getAsin(): string | null {
    return this.asin;
  }
}
