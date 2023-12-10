import { SiteResolver } from './model/resolver/site-resolver.enum';
import { MessageService } from './service/message/message.service';
import { AmazonErrorResolverService } from './service/resolver/amazon/amazon-error-resolver.service';
import { AmazonFormatResolverService } from './service/resolver/amazon/amazon-format-resolver.service';
import { AmazonRerouteService } from './service/resolver/amazon/amazon-reroute.service';
import { AmazonResolverService } from './service/resolver/amazon/amazon-resolver.service';
import { AmazonApiService } from './service/resolver/amazon/api/amazon-api.service';
import { ArchiveResolverService } from './service/resolver/archive/archive-resolver.service';
import { AudibleResolverService } from './service/resolver/audible/audible-resolver.service';
import { OpenLibraryResolverService } from './service/resolver/openlibrary/open-library-resolver.service';
import { Resolver } from './service/resolver/resolver';
import { ResolverService } from './service/resolver/resolver.service';
import { EverandResolverService } from './service/resolver/everand/everand-resolver.service';
import { StorytelApiResolverService } from './service/resolver/storytel/api/storytel-api-resolver.service';
import { StorytelConsumableResolverService } from './service/resolver/storytel/storytel-consumable-resolver.service';
import { StatisticsService } from './service/statistics/statistic.service';
import { BotService } from './service/telegram/bot.service';
import { TwitterService } from './service/twitter/twitter.service';
import { AuthorValidatorService } from './service/validator/author/author-validator.service';
import { LanguageValidatorService } from './service/validator/language/language-validator.service';
import { PublisherValidatorService } from './service/validator/publisher/publisher-validator.service';
import { TitleValidatorService } from './service/validator/title/title-validator.service';
import { Validator } from './service/validator/validator';
import { ValidatorService } from './service/validator/validator.service';

export class ApplicationContext {
  private beans: Record<string, any> = {};

  constructor() {
    this.log('[Request Generator] Starting context');

    const statisticsService: StatisticsService = new StatisticsService();

    // storytel api
    let storytelAuth: string | undefined = process.env.STORYTEL_AUTHS;
    if (storytelAuth == undefined) {
      storytelAuth = '[]';
    }

    // amazon api
    const sitestripeMarketplaceId: string | undefined =
      process.env.AMAZON_API_SITESTRIPE_MARKETPLACE_ID;
    const sitestripeLongUrlParams: string | undefined =
      process.env.AMAZON_API_SITESTRIPE_LONG_URL_PARAMS;
    const sitestripeCookies: string | undefined =
      process.env.AMAZON_API_SITESTRIPE_COOKIES;

    const amazonApiService: AmazonApiService = new AmazonApiService(
      sitestripeMarketplaceId,
      sitestripeLongUrlParams,
      sitestripeCookies
    );

    // resolvers
    const resolvers: Record<SiteResolver, Resolver> = {
      [SiteResolver.AMAZON]: new AmazonResolverService(
        statisticsService,
        amazonApiService,
        new AmazonFormatResolverService(),
        new AmazonErrorResolverService(),
        new AmazonRerouteService(statisticsService)
      ),
      [SiteResolver.AUDIBLE]: new AudibleResolverService(statisticsService),
      [SiteResolver.EVERAND]: new EverandResolverService(statisticsService),
      [SiteResolver.STORYTEL]: new StorytelConsumableResolverService(
        new StorytelApiResolverService(storytelAuth),
        statisticsService
      ),
      [SiteResolver.ARCHIVE]: new ArchiveResolverService(statisticsService),
      [SiteResolver.OPENBOOKS]: new OpenLibraryResolverService(
        statisticsService
      ),
    };

    const resolverService: ResolverService = new ResolverService(
      resolvers,
      statisticsService
    );

    // validators
    const validators: Validator[] = [
      new LanguageValidatorService(),
      new AuthorValidatorService(),
      new TitleValidatorService(),
      new PublisherValidatorService(),
    ];
    const validatorService: ValidatorService = new ValidatorService(validators);

    validatorService.refresh().then(() => {
      this.log('Validators loaded');
    });

    // twitter
    const appKey: string | undefined = process.env.TWITTER_APP_KEY;
    const appSecret: string | undefined = process.env.TWITTER_APP_SECRET;
    const accessToken: string | undefined = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret: string | undefined = process.env.TWITTER_ACCESS_SECRET;

    let twitterService: TwitterService | null = null;
    if (
      appKey != undefined &&
      appSecret != undefined &&
      accessToken != undefined &&
      accessSecret != undefined
    ) {
      twitterService = new TwitterService(
        appKey,
        appSecret,
        accessToken,
        accessSecret,
        amazonApiService
      );
    }

    // messages
    const messageService: MessageService = new MessageService(
      resolverService,
      validatorService,
      twitterService
    );

    // telegram
    const token: string = process.env.BOT_TOKEN as string;
    const botService: BotService = new BotService(
      messageService,
      validatorService,
      statisticsService,
      amazonApiService,
      token
    );

    this.beans[BotService.name] = botService;

    this.log('[Request Generator] Context started');
  }

  private log(message: string): void {
    console.debug(new Date().toISOString() + ' ' + message);
  }

  getBean<T>(name: string): T {
    return this.beans[name] as T;
  }
}
