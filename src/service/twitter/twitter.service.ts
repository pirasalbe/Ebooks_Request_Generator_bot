import { TwitterApi, TwitterApiTokens } from 'twitter-api-v2';
import TwitterApiv2ReadWrite from 'twitter-api-v2/dist/v2/client.v2.write';

import { Message } from './../../model/telegram/message';

export class TwitterService {
  static readonly TWEET_MAX_SIZE = 280;

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

      const text: string = this.toTweet(message);

      if (text.length < TwitterService.TWEET_MAX_SIZE) {
        this.twitterApiReadWrite.tweet(text).catch((err) => {
          console.debug('Error sending tweet', err);
        });
      }
    }
  }

  private toTweet(message: Message): string {
    let tweet = '';

    // tags
    const site: string = message.getSiteName().toLowerCase();
    tweet += message.toTileString();
    if (!tweet.includes(site)) {
      tweet = '#' + site + ' ' + tweet;
    }

    tweet += '\n';

    // info
    const info: string = message.getTitle() + 'by ' + message.getAuthor();
    const link: string = message.getLink();

    if (tweet.length + link.length < TwitterService.TWEET_MAX_SIZE) {
      tweet += info;
    }

    tweet += link;

    return tweet;
  }
}
