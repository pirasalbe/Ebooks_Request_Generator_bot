import { Context, Telegraf, Telegram } from 'telegraf';
import { Update } from 'typegram';

import { ResolverService } from '../resolver/resolver.service';

export class BotService {
  private telegram: Telegram;
  private bot: Telegraf<Context<Update>>;

  private resolverService: ResolverService;

  constructor(resolverService: ResolverService, token: string) {
    this.resolverService = resolverService;

    // init bot
    this.telegram = new Telegram(token);
    this.bot = new Telegraf(token);

    // init handlers
    this.initializeHandlers();

    // start bot
    this.bot.launch();

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  /**
   * Enable requests handlers
   */
  private initializeHandlers(): void {
    this.bot.start((ctx) => {
      ctx.reply(this.helpMessage());
    });
    this.bot.help((ctx) => {
      ctx.reply(this.helpMessage());
    });

    this.bot.on('text', (ctx) => {
      try {
        this.resolverService
          .resolve(ctx.message.text)
          .then((message: string) => {
            ctx.reply(message);
          })
          .catch((error: string) => {
            console.error('Error resolving message', ctx.message.text, error);
            ctx.reply(error);
          });
      } catch (error) {
        console.error('Error handling request', ctx.message.text, error);
        ctx.reply('There was an error handling your request');
      }
    });
  }

  private helpMessage(): string {
    return 'Send a link to get the request from it.';
  }
}
