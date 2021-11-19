import { SiteResolver } from './model/resolver/site-resolver.enum';
import { AmazonCaptchaResolverService } from './service/resolver/amazon/amazon-captcha-resolver.service';
import { AmazonFormatResolverService } from './service/resolver/amazon/amazon-format-resolver.service';
import { AmazonRerouteService } from './service/resolver/amazon/amazon-reroute.service';
import { AmazonResolverService } from './service/resolver/amazon/amazon-resolver.service';
import { ArchiveResolverService } from './service/resolver/archive/archive-resolver.service';
import { AudibleResolverService } from './service/resolver/audible/audible-resolver.service';
import { OpenLibraryResolverService } from './service/resolver/openlibrary/open-library-resolver.service';
import { Resolver } from './service/resolver/resolver';
import { ResolverService } from './service/resolver/resolver.service';
import { ScribdResolverService } from './service/resolver/scribd/scribd-resolver.service';
import { StorytelResolverService } from './service/resolver/storytel/storytel-resolver.service';
import { StatisticsService } from './service/statistics/statistic.service';
import { BotService } from './service/telegram/bot.service';
import { AuthorValidatorService } from './service/validator/author/author-validator.service';
import { TitleValidatorService } from './service/validator/author/title-validator.service';
import { Validator } from './service/validator/validator';
import { ValidatorService } from './service/validator/validator.service';

export class ApplicationContext {
  private beans: Record<string, any> = {};

  constructor() {
    this.log('[Request Generator] Starting context');

    const token: string = process.env.BOT_TOKEN as string;

    const statisticsService: StatisticsService = new StatisticsService();

    const resolvers: Record<SiteResolver, Resolver> = {
      0: new AmazonResolverService(
        statisticsService,
        new AmazonFormatResolverService(),
        new AmazonCaptchaResolverService(),
        new AmazonRerouteService(statisticsService)
      ),
      1: new AudibleResolverService(statisticsService),
      2: new ScribdResolverService(statisticsService),
      3: new StorytelResolverService(statisticsService),
      4: new ArchiveResolverService(statisticsService),
      5: new OpenLibraryResolverService(statisticsService),
    };

    const resolverService: ResolverService = new ResolverService(
      resolvers,
      statisticsService
    );

    const validators: Validator[] = [
      new AuthorValidatorService(),
      new TitleValidatorService(),
    ];
    const validatorService: ValidatorService = new ValidatorService(validators);

    validatorService.refresh().then(() => {
      this.log('Validators loaded');
    });

    const botService: BotService = new BotService(
      resolverService,
      validatorService,
      statisticsService,
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
