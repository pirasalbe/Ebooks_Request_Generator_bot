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
import { ScribdResolverService } from './service/resolver/scribd/scribd-resolver.service';
import { StorytelApiResolverService } from './service/resolver/storytel/api/storytel-api-resolver.service';
import { StorytelConsumableResolverService } from './service/resolver/storytel/storytel-consumable-resolver.service';
import { StatisticsService } from './service/statistics/statistic.service';
import { BotService } from './service/telegram/bot.service';
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
      0: new AmazonResolverService(
        statisticsService,
        amazonApiService,
        new AmazonFormatResolverService(),
        new AmazonErrorResolverService(),
        new AmazonRerouteService(statisticsService)
      ),
      1: new AudibleResolverService(statisticsService),
      2: new ScribdResolverService(statisticsService),
      3: new StorytelConsumableResolverService(
        new StorytelApiResolverService(storytelAuth),
        statisticsService
      ),
      4: new ArchiveResolverService(statisticsService),
      5: new OpenLibraryResolverService(statisticsService),
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

    // messages
    const messageService: MessageService = new MessageService(
      resolverService,
      validatorService
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
