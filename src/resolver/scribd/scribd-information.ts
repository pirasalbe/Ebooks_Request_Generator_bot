export type ScribdInformation = {
  author: ScribdAuthor;
  contentType: 'book' | 'audiobook';
  publisher: ScribdPublisher;
  releaseDate: string;
  title: string;
};

export type ScribdInformationWrapper = {
  contentItem: ScribdInformation;
};

export type ScribdAuthor = {
  name: string;
};

export type ScribdPublisher = {
  name: string;
};
