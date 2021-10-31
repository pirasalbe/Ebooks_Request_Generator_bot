import { AmazonResolverService } from './resolver/amazon/amazon-resolver.service';
import { AudibleResolverService } from './resolver/audible/audible-resolver.service';
import { Resolver } from './resolver/resolver';
import { ResolverService } from './resolver/resolver.service';
import { SiteResolver } from './resolver/site-resolver.enum';
import { BotService } from './telegram/bot.service';

export class ApplicationContext {
  private beans: Record<string, any> = {};

  constructor() {
    console.debug('Starting context');

    const token: string = process.env.BOT_TOKEN as string;

    const resolvers: Record<SiteResolver, Resolver> = {
      0: new AmazonResolverService(),
      1: new AudibleResolverService(),
    };

    const resolverService: ResolverService = new ResolverService(resolvers);
    const botService: BotService = new BotService(resolverService, token);

    this.beans[BotService.name] = botService;

    console.debug('Context started');
  }

  getBean<T>(name: string): T {
    return this.beans[name] as T;
  }
}
