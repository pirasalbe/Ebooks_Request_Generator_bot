import { AmazonApiService } from './../resolver/amazon/api/amazon-api.service';
import {
  TweetV2PostTweetResult,
  TwitterApi,
  TwitterApiTokens,
} from 'twitter-api-v2';
import TwitterApiv2ReadWrite from 'twitter-api-v2/dist/v2/client.v2.write';

import { Message } from './../../model/telegram/message';
import { SiteResolver } from '../../model/resolver/site-resolver.enum';
import { URL } from 'url';

export class TwitterService {
  static readonly TWEET_MAX_SIZE = 280;

  private twitterApi: TwitterApi;
  private twitterApiReadWrite: TwitterApiv2ReadWrite;

  private amazonApiService: AmazonApiService;

  constructor(
    appKey: string,
    appSecret: string,
    accessToken: string,
    accessSecret: string,
    amazonApiService: AmazonApiService
  ) {
    const twitterToken: TwitterApiTokens = {
      appKey: appKey,
      appSecret: appSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    };
    this.twitterApi = new TwitterApi(twitterToken);
    this.twitterApiReadWrite = this.twitterApi.readWrite.v2;
    this.amazonApiService = amazonApiService;
  }

  tweet(messages: Message[]): void {
    if (messages.length > 0) {
      const message: Message = messages[0];

      this.toTweet(message).then((text: string) => {
        if (text.length < TwitterService.TWEET_MAX_SIZE) {
          this.twitterApiReadWrite
            .tweet(text)
            .catch((err) => console.debug('Error sending tweet', String(err)));
        }
      });
    }
  }

  private toTweet(message: Message): Promise<string> {
    // tags
    let tweet: string = message.toTileString().trim();

    const site: string = message.getSiteName().toLowerCase();
    if (!tweet.includes(site)) {
      tweet = '#' + site + ' ' + tweet;
    }

    tweet += '\n';

    // info
    const info: string =
      message.getTitle() + ' by ' + message.getAuthorsAsString();
    return new Promise<string>((resolve) =>
      this.getLink(message).then((link: string) => {
        if (tweet.length + link.length < TwitterService.TWEET_MAX_SIZE) {
          tweet += info + '\n';
        }

        tweet += link;

        resolve(tweet);
      })
    );
  }

  private getLink(message: Message): Promise<string> {
    let link: Promise<string> = Promise.resolve(message.getLink());

    if (message.getSite() == SiteResolver.AMAZON) {
      const longUrl: URL = new URL(message.getUrl().toString());
      link = this.amazonApiService.siteStripe(longUrl);
    }

    return link;
  }
}
