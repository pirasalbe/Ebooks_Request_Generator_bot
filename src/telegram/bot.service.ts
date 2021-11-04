import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import {
  InlineQueryResult,
  InlineQueryResultArticle,
  InputTextMessageContent,
  Message as TelegramMessage,
  Update,
} from 'typegram';

import { Message } from '../resolver/message';
import { ResolverService } from '../resolver/resolver.service';

export class BotService {
  private static readonly SUCCESSFULL_THUMB_URL =
    'https://telegra.ph/file/5b2fad22d5b296b843acf.jpg';
  private static readonly INVALID_THUMB_URL =
    'https://www.downloadclipart.net/large/14121-warning-icon-design.png';

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
      ctx.replyWithHTML(this.helpMessage());
    });
    this.bot.help((ctx) => {
      ctx.replyWithHTML(this.helpMessage());
    });

    this.bot.on('inline_query', (ctx) => {
      this.safeHandling(() => {
        if (ctx.inlineQuery.query != '') {
          this.resolve(this.extractUrl(ctx.inlineQuery.query))
            .then((message: Message) => {
              ctx.answerInlineQuery([
                this.inlineResult(
                  'Request',
                  message.toString(),
                  message.toSmallString(),
                  BotService.SUCCESSFULL_THUMB_URL
                ),
              ]);
            })
            .catch((error: string) => {
              ctx.answerInlineQuery([
                this.inlineResult(
                  'Error!',
                  error,
                  error,
                  BotService.INVALID_THUMB_URL
                ),
              ]);
            });
        } else {
          ctx.answerInlineQuery([
            this.inlineResult(
              'Incomplete Request!',
              'Incomplete Request!',
              this.smallHelpMessage(),
              BotService.INVALID_THUMB_URL
            ),
          ]);
        }
      });
    });

    this.bot.on('text', (ctx) => {
      this.safeHandling(() => {
        // manage direct messages only
        if (ctx.message.via_bot == undefined) {
          ctx
            .reply('Processing...')
            .then((loader: TelegramMessage.TextMessage) => {
              this.resolve(this.extractUrl(ctx.message.text))
                .then((message: Message) => {
                  ctx.telegram.editMessageText(
                    ctx.from.id,
                    loader.message_id,
                    undefined,
                    message.toString(),
                    {
                      disable_web_page_preview: true,
                      parse_mode: 'HTML',
                      ...Markup.inlineKeyboard([
                        Markup.button.switchToChat('Forward', ctx.message.text),
                      ]),
                    }
                  );
                })
                .catch((error: string) => {
                  ctx.deleteMessage(loader.message_id);
                  ctx.reply(error);
                });
            })
            .catch((error: string) => {
              console.error('Cannot start processing request.', error);
              ctx.reply('Cannot start processing request.');
            });
        }
      });
    });
  }

  private safeHandling(unsafeFunction: () => void): void {
    try {
      unsafeFunction();
    } catch (e) {
      console.error('Unexpected error', e);
    }
  }

  private extractUrl(text: string): string {
    let result: string = text;

    if (text.includes(' ')) {
      const elements: string[] = text.split(' ');

      const url: string | undefined = elements.find((s: string) =>
        s.startsWith('http')
      );

      if (url != undefined) {
        result = url;
      }
    }

    return result;
  }

  private resolve(text: string): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      try {
        this.resolverService
          .resolve(text)
          .then((message: Message) => {
            resolve(message);
          })
          .catch((error: string) => {
            console.error('Error resolving message', text, error);
            reject(error);
          });
      } catch (error) {
        console.error('Error handling request', text, error);
        reject('There was an error handling your request.');
      }
    });
  }

  private smallHelpMessage(): string {
    return 'Send me an Amazon/Audible/Scribd/Storytel/Archive link to get a well-formatted request ready to be posted in groups.';
  }

  private helpMessage(): string {
    return (
      this.smallHelpMessage() +
      ' You can then forward the same request to the group.' +
      '\n\n' +
      'You can use me inline as well. Just click on the button below or send <code>@ebooks_request_generator_bot link</code>.'
    );
  }

  private inlineResult(
    title: string,
    message: string,
    description: string,
    thumb_url: string
  ): InlineQueryResult {
    const content: InputTextMessageContent = {
      message_text: message,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    };

    const result: InlineQueryResultArticle = {
      id: '1',
      type: 'article',
      title: title,
      input_message_content: content,
      description: description,
      thumb_url: thumb_url,
    };
    return result;
  }
}
