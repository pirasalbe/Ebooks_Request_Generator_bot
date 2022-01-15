import { Exception } from '../exception';
import * as SDK from 'paapi5-typescript-sdk';

export type AmazonApiException = Exception & {
  errors: SDK.APIError[];
};
