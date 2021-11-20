import { HTMLElement } from 'node-html-parser';

export type ArchiveInformation = {
  header: ArchiveHeader;
  body: HTMLElement;
};

export type ArchiveHeader = {
  element: HTMLElement;
  title: HTMLElement;
};
