import { TwitterApi, TwitterApiTokens } from 'twitter-api-v2';
import TwitterApiv2ReadWrite from 'twitter-api-v2/dist/v2/client.v2.write';

import { Message } from './../../model/telegram/message';

export class TwitterService {
  private twitterApi: TwitterApi;
  private twitterApiReadWrite: TwitterApiv2ReadWrite;

  constructor(
    appKey: string,
    appSecret: string,
    accessToken: string,
    accessSecret: string
  ) {
    const twitterToken: TwitterApiTokens = {
      appKey: appKey,
      appSecret: appSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    };
    this.twitterApi = new TwitterApi(twitterToken);
    this.twitterApiReadWrite = this.twitterApi.readWrite.v2;
  }

  tweet(messages: Message[]): void {
    if (messages.length > 0) {
      const message: Message = messages[0];

      this.twitterApiReadWrite.tweet('Test tweet').catch((err) => {
        console.debug('Error sending tweet', err);
      });
    }
  }
}
