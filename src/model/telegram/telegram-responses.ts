import { InputFile } from 'telegraf/typings/core/types/typegram';
import { ExtraDocument } from 'telegraf/typings/telegram-types';

export type DocumentResponse = {
  document: InputFile;
  extra: ExtraDocument;
};
