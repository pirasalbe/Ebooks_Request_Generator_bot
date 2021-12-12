import { StorytelAuthor, StorytelPublisher } from './storytel-information';

export type StorytelItemInformation = {
  bookId: string;
  result: 'success' | 'error';
  slb: StorytelSlb;
};

export type StorytelSlb = {
  abook: StorytelItem;
  book: StorytelBook;
  ebook: StorytelItem;
  shareUrl: string;
};

export type StorytelItem = {
  id: number;
  publisher: StorytelPublisher;
  releaseDateFormat: string;
};

export type StorytelBook = {
  name: string;
  authors: StorytelAuthor[];
  language: StorytelLanguage;
  latestReleaseDate: string;
};

export type StorytelLanguage = {
  isoValue: string;
  name: string;
};
