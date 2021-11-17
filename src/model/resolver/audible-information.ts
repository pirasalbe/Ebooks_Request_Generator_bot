export type AudibleInformation = {
  bookFormat: string;
  name: string;
  description: string;
  author: AudibleAuthor[];
  publisher: string;
  datePublished: string;
  inLanguage: string;
};

export type AudibleAuthor = {
  '@type': string;
  name: string;
};
