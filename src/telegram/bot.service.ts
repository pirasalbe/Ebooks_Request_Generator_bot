import { Context, Telegraf, Telegram } from 'telegraf';
import { InlineQueryResult, InlineQueryResultArticle, InputTextMessageContent, Update } from 'typegram';

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

    this.bot.on('inline_query', (ctx) => {
      if (ctx.inlineQuery.query != '') {
        this.resolve(ctx.inlineQuery.query)
          .then((message: string) => {
            ctx.answerInlineQuery([
              this.inlineResult(
                'Request',
                message,
                'Click me to send the request'
              ),
            ]);
          })
          .catch((error: string) => {
            ctx.answerInlineQuery([this.inlineResult('Error!', error, error)]);
          });
      }
    });

    this.bot.on('text', (ctx) => {
      this.resolve(ctx.message.text)
        .then((message: string) => {
          ctx.reply(message);
        })
        .catch((error: string) => {
          ctx.reply(error);
        });
    });
  }

  private resolve(text: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        this.resolverService
          .resolve(text)
          .then((message: string) => {
            resolve(message);
          })
          .catch((error: string) => {
            console.error('Error resolving message', text, error);
            reject(error);
          });
      } catch (error) {
        console.error('Error handling request', text, error);
        reject('There was an error handling your request');
      }
    });
  }

  private helpMessage(): string {
    return 'Send a link to get the request from it.';
  }

  private inlineResult(
    title: string,
    message: string,
    description: string
  ): InlineQueryResult {
    const content: InputTextMessageContent = {
      message_text: message,
      disable_web_page_preview: true,
    };

    const result: InlineQueryResultArticle = {
      id: '1',
      type: 'article',
      title: title,
      input_message_content: content,
      description: description,
    };

    return result;
  }
}
