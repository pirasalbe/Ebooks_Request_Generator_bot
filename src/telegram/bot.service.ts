import { Context, Telegraf, Telegram } from 'telegraf';
import { ExtraAnswerInlineQuery } from 'telegraf/typings/telegram-types';
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
  private static readonly EXTRA_INLINE_RESPONSE: ExtraAnswerInlineQuery = {
    switch_pm_text: 'Use in PM',
    switch_pm_parameter: 'help',
  };

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
      if (ctx.inlineQuery.query != '') {
        this.resolve(ctx.inlineQuery.query)
          .then((message: Message) => {
            ctx.answerInlineQuery(
              [
                this.inlineResult(
                  'Request',
                  message.toString(),
                  message.toSmallString(),
                  BotService.SUCCESSFULL_THUMB_URL
                ),
              ],
              BotService.EXTRA_INLINE_RESPONSE
            );
          })
          .catch((error: string) => {
            ctx.answerInlineQuery(
              [
                this.inlineResult(
                  'Error!',
                  error,
                  error,
                  BotService.INVALID_THUMB_URL
                ),
              ],
              BotService.EXTRA_INLINE_RESPONSE
            );
          });
      } else {
        ctx.answerInlineQuery(
          [
            this.inlineResult(
              'Incomplete Request!',
              'Incomplete Request!',
              this.smallHelpMessage(),
              BotService.INVALID_THUMB_URL
            ),
          ],
          BotService.EXTRA_INLINE_RESPONSE
        );
      }
    });

    this.bot.on('text', async (ctx) => {
      ctx
        .reply('Processing...')
        .then((loader: TelegramMessage.TextMessage) => {
          this.resolve(ctx.message.text)
            .then((message: Message) => {
              ctx.telegram.editMessageText(
                ctx.from.id,
                loader.message_id,
                undefined,
                message.toString(),
                {
                  disable_web_page_preview: true,
                  parse_mode: 'HTML',
                }
              );
            })
            .catch((error: string) => {
              ctx.reply(error);
            });
        })
        .catch((error: string) => {
          console.error('Cannot start processing request.', error);
          ctx.reply('Cannot start processing request.');
        });
    });
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
