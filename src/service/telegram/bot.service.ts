import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import { ExtraAnswerInlineQuery, ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  InlineQueryResult,
  InlineQueryResultArticle,
  InputTextMessageContent,
  Message as TelegramMessage,
  MessageEntity,
  Update,
  User,
  UserFromGetMe,
} from 'typegram';

import { ResolverException } from '../../model/error/resolver-exception';
import { Message } from '../../model/telegram/message';
import { DocumentResponse } from '../../model/telegram/telegram-responses';
import { MessageService } from '../message/message.service';
import { ValidatorService } from '../validator/validator.service';
import { StatisticsService } from './../statistics/statistic.service';

export class BotService {
  private static readonly REPORT: string = '/report';

  private static readonly SUCCESSFULL_THUMB_URL =
    'https://telegra.ph/file/5b2fad22d5b296b843acf.jpg';
  private static readonly INVALID_THUMB_URL =
    'https://www.downloadclipart.net/large/14121-warning-icon-design.png';

  private token: string;
  private telegram: Telegram;
  private bot: Telegraf<Context<Update>>;

  private messageService: MessageService;
  private validatorService: ValidatorService;
  private statisticsService: StatisticsService;

  constructor(
    messageService: MessageService,
    validatorService: ValidatorService,
    statisticsService: StatisticsService,
    token: string
  ) {
    this.messageService = messageService;
    this.validatorService = validatorService;
    this.statisticsService = statisticsService;

    // init bot
    this.token = token;
    this.telegram = new Telegram(this.token);
    this.bot = new Telegraf(this.token);

    // start bot
    this.initializeBot();

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  private initializeBot(): void {
    this.telegram = new Telegram(this.token);
    this.bot = new Telegraf(this.token);

    // init handlers
    this.initializeHandlers();

    // start bot
    this.bot.launch();
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
    this.bot.command('stats', (ctx) => {
      ctx.reply(this.statisticsService.toString(), {
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message.message_id,
      });
    });
    this.bot.command('refresh', (ctx) => {
      ctx.reply('Refresh in progress').then((loading: TelegramMessage) => {
        this.validatorService.refresh(true).then(() => {
          ctx.deleteMessage(loading.message_id);
          ctx.reply('Refresh completed', {
            reply_to_message_id: ctx.message.message_id,
          });
        });
      });
    });

    this.bot.on('inline_query', (ctx) => {
      this.safeHandling(() => {
        if (ctx.inlineQuery.query != '') {
          this.statisticsService.getStats().increaseInlineRequestCount();
          const extra: ExtraAnswerInlineQuery = { cache_time: 60 };

          this.messageService
            .getMessages(this.extractUrlFromText(ctx.inlineQuery.query))
            .then((messages: Message[]) => {
              const inlineResults: InlineQueryResult[] = [];

              for (let i = 0; i < messages.length; i++) {
                const message: Message = messages[i];

                inlineResults.push(
                  this.inlineResult(
                    'Request ' + message.toTileString(),
                    message.toString(),
                    message.toDetailsString(),
                    BotService.SUCCESSFULL_THUMB_URL,
                    String(i)
                  )
                );
              }

              ctx.answerInlineQuery(inlineResults, extra);
            })
            .catch((error: string) => {
              const errorResponse: string =
                this.messageService.getErrorMessage(error);
              this.statisticsService
                .getStats()
                .increaseErrorCount(errorResponse);
              ctx.answerInlineQuery(
                [
                  this.inlineResult(
                    'Error!',
                    errorResponse,
                    errorResponse,
                    BotService.INVALID_THUMB_URL
                  ),
                ],
                extra
              );
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
        // avoid messages from the bot
        if (!this.isMessageFromBot(ctx.message.via_bot, ctx.botInfo)) {
          const report: boolean = ctx.message.text.startsWith(
            BotService.REPORT
          );
          this.statisticsService.getStats().increaseTextRequestCount();
          const extra: ExtraReplyMessage = {
            reply_to_message_id: ctx.message.message_id,
          };

          // send placeholder
          ctx
            .reply('Processing...', extra)
            .then((loader: TelegramMessage.TextMessage) => {
              // resolve message from url
              this.messageService
                .getMessages(
                  this.extractUrl(ctx.message.text, ctx.message.entities)
                )
                .then((messages: Message[]) => {
                  ctx.deleteMessage(loader.message_id);
                  for (const message of messages) {
                    ctx.reply(message.toString(), {
                      disable_web_page_preview: true,
                      parse_mode: 'HTML',
                      reply_to_message_id: ctx.message.message_id,
                      ...Markup.inlineKeyboard([
                        Markup.button.switchToChat('Forward', ctx.message.text),
                      ]),
                    });
                  }
                })
                .catch((error: unknown) => {
                  ctx.deleteMessage(loader.message_id);
                  this.statisticsService
                    .getStats()
                    .increaseErrorCount(
                      this.messageService.getErrorMessage(error)
                    );
                  if (
                    report &&
                    this.messageService.isResolverException(error)
                  ) {
                    const documentResponse: DocumentResponse =
                      this.getReportResponse(
                        error as ResolverException,
                        ctx.message.message_id
                      );
                    ctx.replyWithDocument(
                      documentResponse.document,
                      documentResponse.extra
                    );
                  } else {
                    ctx.reply(
                      this.messageService.getErrorMessage(error),
                      extra
                    );
                  }
                });
            })
            .catch((error: string) => {
              console.error('Cannot start processing request.', error);
              ctx.reply('Cannot start processing request.', extra);
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

  private extractUrl(text: string, entities: MessageEntity[] = []): string {
    let result: string | null = null;

    // check entities
    if (entities.length > 0) {
      result = this.extractUrlFromEntities(text, entities);
    }

    // no url found, check text
    if (result == null) {
      result = this.extractUrlFromText(text);
    }

    return result;
  }

  private extractUrlFromEntities(
    text: string,
    entities: MessageEntity[]
  ): string | null {
    let result: string | null = null;

    const textLinkEntity: MessageEntity | undefined = entities.find(
      (e: MessageEntity) => e.type == 'text_link'
    );
    const urlEntity: MessageEntity | undefined = entities.find(
      (e: MessageEntity) => e.type == 'url'
    );
    if (textLinkEntity != undefined) {
      const entity = textLinkEntity as MessageEntity.TextLinkMessageEntity;
      result = entity.url;
    } else if (urlEntity != undefined) {
      result = text.substr(urlEntity.offset, urlEntity.length);
    }

    return result;
  }

  private extractUrlFromText(text: string): string {
    let result: string = text;

    if (text.includes(' ')) {
      const elements: string[] = text.replaceAll('\n', ' ').split(' ');

      const url: string | undefined = elements.find((s: string) =>
        s.includes('http')
      );

      if (url != undefined) {
        result = url;
      }
    }

    const index: number = result.indexOf('http');
    if (index > 0) {
      result = result.substr(index);
    }

    return result;
  }

  private isMessageFromBot(
    user: User | undefined,
    bot: UserFromGetMe
  ): boolean {
    return user != undefined && user.is_bot && user.id == bot.id;
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
    thumb_url: string,
    index = '1'
  ): InlineQueryResult {
    const content: InputTextMessageContent = {
      message_text: message,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    };

    const result: InlineQueryResultArticle = {
      id: index,
      type: 'article',
      title: title,
      input_message_content: content,
      description: description,
      thumb_url: thumb_url,
    };
    return result;
  }

  private getReportResponse(
    exception: ResolverException,
    messageId: number
  ): DocumentResponse {
    return {
      document: {
        filename: 'report.html',
        source: Buffer.from(exception.html, 'utf8'),
      },
      extra: {
        caption: exception.message,
        reply_to_message_id: messageId,
      },
    };
  }
}
