import { ValidatorType } from './validator-type';

export const VALIDATOR_TITLE: Record<
  ValidatorType,
  { plural: string; singular: string; title: string }
> = {
  title: { plural: 'titles', singular: 'title', title: 'Titles' },
  author: { plural: 'authors', singular: 'author', title: 'Authors' },
  publisher: {
    plural: 'publishers',
    singular: 'publisher',
    title: 'Publishers',
  },
};
