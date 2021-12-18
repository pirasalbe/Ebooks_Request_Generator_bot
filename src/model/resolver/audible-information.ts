export type AudibleInformation = {
  '@type': 'BreadcrumbList' | 'Audiobook' | 'Product' | 'PodcastSeries';
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
