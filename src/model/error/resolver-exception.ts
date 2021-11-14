import { Exception } from './exception';

export type ResolverException = Exception & {
  html: string;
};
