export type ScribdAdditionalInformationWrapper = {
  contentItem: ScribdAlternativeInformation;
  i18n: ScribdI18n;
};

export type ScribdAlternativeInformation = {
  author: ScribdAuthor;
  contentType: 'book' | 'audiobook';
  publisher: ScribdPublisher;
  releaseDate: string;
  title: string;
};

export type ScribdAuthor = {
  name: string;
};

export type ScribdPublisher = {
  name: string;
};

export type ScribdI18n = {
  languages: ScribdLanguage[];
};

export type ScribdLanguage = {
  prefix: string;
  lcid: string;
  name: string;
};

export type ScribdInformationI18n = {
  information: ScribdInformation;
  languages: ScribdLanguage[];
};

export type ScribdInformationWrapper = {
  '@graph': ScribdInformation[];
};

export type ScribdInformation = {
  '@type': 'Book' | 'Audiobook';
  name: string;
  inLanguage: string;
  author: string | ScribdAuthor[];
  publisher: string;
  datePublished: string;
};
