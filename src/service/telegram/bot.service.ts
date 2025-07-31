import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import {
  ExtraAnimation,
  ExtraAnswerInlineQuery,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import {
  InlineQueryResult,
  InlineQueryResultArticle,
  InputTextMessageContent,
  MessageEntity,
  Message as TelegramMessage,
  Update,
  User,
  UserFromGetMe,
} from 'typegram';
import { URL } from 'url';
import { BotUtil } from './../../util/bot-util';

import { ResolverException } from '../../model/error/resolver-exception';
import { Message } from '../../model/telegram/message';
import { DocumentResponse } from '../../model/telegram/telegram-responses';
import { VALIDATOR_TITLE } from '../../model/validator/validator-details';
import { ValidatorType } from '../../model/validator/validator-type';
import { DateUtil } from '../../util/date-util';
import { AdminService } from '../admins/admin.service';
import { MessageService } from '../message/message.service';
import { AbstractValidator } from '../validator/abstract-validator';
import { ValidatorService } from '../validator/validator.service';
import { AmazonApiService } from './../resolver/amazon/api/amazon-api.service';
import { StatisticsService } from './../statistics/statistic.service';

export class BotService {
  private static readonly REPORT: string = '/report';
  private static readonly INLINE_COMMAND: string = 'inline';
  private static readonly SUPPORT_COMMAND: string = 'support';

  private static readonly SUCCESSFULL_THUMB_URL =
    'https://telegra.ph/file/5b2fad22d5b296b843acf.jpg';
  private static readonly INVALID_THUMB_URL =
    'https://www.downloadclipart.net/large/14121-warning-icon-design.png';

  private static readonly INLINE_TUTORIAL_ID =
    'CgACAgQAAxkBAAIfqGGjiv7C2Zso9D3XrmUQx5ZklxCyAAI5CgACk40QUeXUPtz-_XoJIgQ';

  private token: string;
  private telegram: Telegram;
  private bot: Telegraf<Context<Update>>;

  private adminService: AdminService;
  private messageService: MessageService;
  private validatorService: ValidatorService;
  private validators: Record<ValidatorType, AbstractValidator<unknown>>;
  private statisticsService: StatisticsService;

  private amazonApiService: AmazonApiService;

  constructor(
    adminService: AdminService,
    messageService: MessageService,
    validatorService: ValidatorService,
    validators: Record<ValidatorType, AbstractValidator<unknown>>,
    statisticsService: StatisticsService,
    amazonApiService: AmazonApiService,
    token: string
  ) {
    this.adminService = adminService;
    this.messageService = messageService;
    this.validatorService = validatorService;
    this.validators = validators;
    this.statisticsService = statisticsService;
    this.amazonApiService = amazonApiService;

    // init bot
    this.token = token;

    // start bot
    this.telegram = new Telegram(this.token);
    this.bot = new Telegraf(this.token);
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
      ctx
        .replyWithHTML(this.helpMessage())
        .then(() => {
          // inline help on start
          if (ctx.startPayload == BotService.INLINE_COMMAND) {
            ctx
              .replyWithAnimation(
                BotService.INLINE_TUTORIAL_ID,
                this.inlineExtra(ctx.message.message_id)
              )
              .catch((error) => this.onError(error));
          } else if (ctx.startPayload == BotService.SUPPORT_COMMAND) {
            ctx
              .replyWithHTML(this.supportHelp())
              .catch((error) => this.onError(error));
          }
        })
        .catch((error) => this.onError(error));
    });

    // help
    this.bot.help((ctx) => {
      ctx
        .replyWithHTML(this.helpMessage())
        .catch((error) => this.onError(error));
    });
    this.bot.command(BotService.INLINE_COMMAND, (ctx) => {
      ctx
        .replyWithAnimation(
          BotService.INLINE_TUTORIAL_ID,
          this.inlineExtra(ctx.message.message_id)
        )
        .catch((error) => this.onError(error));
    });

    // support
    this.bot.command(BotService.SUPPORT_COMMAND, (ctx) => {
      this.safeHandling(() => {
        const url: string = this.extractUrl(
          ctx.message.text,
          ctx.message.entities
        );

        // no url found, reply with help
        if (url.startsWith('/' + BotService.SUPPORT_COMMAND)) {
          ctx
            .replyWithHTML(this.supportHelp())
            .catch((error) => this.onError(error));
        } else {
          const extra: ExtraReplyMessage = {
            reply_to_message_id: ctx.message.message_id,
          };

          // placeholder
          ctx
            .reply('Preparing link...', extra)
            .then((loader: TelegramMessage.TextMessage) => {
              // obtain url
              this.amazonApiService
                .siteStripe(new URL(url))
                .then((supportLink: string) => {
                  // remove placeholder
                  ctx
                    .deleteMessage(loader.message_id)
                    .catch((error) => this.onError(error));

                  // reply with support link
                  ctx
                    .replyWithHTML(
                      'Here is your link:\n' +
                        supportLink +
                        '\n\n<b>Thanks for your support!</b>',
                      {
                        reply_to_message_id: ctx.message.message_id,
                        disable_web_page_preview: true,
                      }
                    )
                    .catch((error) => this.onError(error));
                });
            })
            .catch((error: string) => {
              console.error('Cannot start processing link.', error);
              ctx.reply(
                'Cannot start processing link. Try again in a few seconds.',
                extra
              );
            });
        }
      });
    });

    // pm commands
    this.bot.command('dmca', (ctx) => {
      if (BotUtil.isPrivateChat(ctx.chat.type)) {
        const document = Object.entries(this.validators).reduce(
          (acc, [key, validator]) => {
            const elements = validator
              .listElements()
              .map((element) => validator.format(element));

            const list =
              elements.length > 0 ? elements.join('\n\n') : 'No item found';

            return (
              acc +
              `DMCA ${VALIDATOR_TITLE[key as ValidatorType]}\n\n` +
              '='.repeat(20) +
              '\n\n' +
              list +
              '\n\n' +
              '='.repeat(50) +
              '\n\n\n\n'
            );
          },
          ''
        );
        ctx.replyWithDocument(
          {
            source: Buffer.from(document.trim(), 'utf-8'),
            filename: `DMCA.txt`,
          },
          { caption: `DMCA items as of ${DateUtil.dateToString(new Date())}` }
        );
      }
    });

    // admin commands
    this.bot.command('list_admins', (ctx) => {
      if (this.adminService.isSuperAdmin(ctx.chat.type, ctx.chat.id)) {
        const elements = this.adminService.listAdmin().map(({ id }) => id);
        if (elements.length > 0) {
          ctx.replyWithDocument(
            {
              source: Buffer.from(elements.join('\n'), 'utf-8'),
              filename: `admins.txt`,
            },
            { caption: `${elements.length} items` }
          );
        } else {
          ctx.reply('No item found');
        }
      }
    });
    this.bot.command('add_admin', (ctx) => {
      if (this.adminService.isSuperAdmin(ctx.chat.type, ctx.chat.id)) {
        const adminId = Number(ctx.message.text.split(' ')[1]);
        if (Number.isNaN(adminId)) {
          ctx.reply('Send a correct numeric admin id');
        } else {
          this.adminService.addAdmin(adminId);
          ctx.reply(adminId + ' added as an admin');
        }
      }
    });
    this.bot.command('remove_admin', (ctx) => {
      if (this.adminService.isSuperAdmin(ctx.chat.type, ctx.chat.id)) {
        const adminId = Number(ctx.message.text.split(' ')[1]);
        if (Number.isNaN(adminId)) {
          ctx.reply('Send a correct numeric admin id');
        } else {
          this.adminService.removeAdmin(adminId);
          ctx.reply(adminId + ' removed as an admin');
        }
      }
    });

    // contributors
    this.validatorCommands('title');
    this.validatorCommands('author');
    this.validatorCommands('publisher');
    this.bot.command('refresh', (ctx) => {
      if (this.adminService.isAdmin(ctx.chat.type, ctx.chat.id)) {
        ctx
          .reply('Refresh in progress')
          .then((loading: TelegramMessage) =>
            this.validatorService.refresh(true).then(() => {
              ctx
                .deleteMessage(loading.message_id)
                .catch((error) => this.onError(error));
              ctx
                .reply('Refresh completed', {
                  reply_to_message_id: ctx.message.message_id,
                })
                .catch((error) => this.onError(error));
            })
          )
          .catch((error) => this.onError(error));
      }
    });
    this.bot.command('stats', (ctx) => {
      if (this.adminService.isAdmin(ctx.chat.type, ctx.chat.id)) {
        ctx
          .reply(this.statisticsService.toString(), {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id,
          })
          .catch((error) => this.onError(error));
      }
    });

    // generate request
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

              ctx
                .answerInlineQuery(inlineResults, extra)
                .catch((error) => this.onError(error));
            })
            .catch((error: string) => {
              const errorResponse: string =
                this.messageService.getErrorMessage(error);
              this.statisticsService
                .getStats()
                .increaseErrorCount(errorResponse);
              ctx
                .answerInlineQuery(
                  [
                    this.inlineResult(
                      'Error!',
                      errorResponse,
                      errorResponse,
                      BotService.INVALID_THUMB_URL
                    ),
                  ],
                  extra
                )
                .catch((error) => this.onError(error));
            });
        } else {
          ctx
            .answerInlineQuery([
              this.inlineResult(
                'Incomplete Request!',
                'Incomplete Request!',
                this.smallHelpMessage(),
                BotService.INVALID_THUMB_URL
              ),
            ])
            .catch((error) => this.onError(error));
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
                  ctx
                    .deleteMessage(loader.message_id)
                    .catch((error) => this.onError(error));
                  for (const message of messages) {
                    ctx
                      .reply(message.toString(), {
                        disable_web_page_preview: true,
                        parse_mode: 'HTML',
                        reply_to_message_id: ctx.message.message_id,
                        ...Markup.inlineKeyboard([
                          Markup.button.switchToChat(
                            'Forward',
                            ctx.message.text
                          ),
                        ]),
                      })
                      .catch((error) => this.onError(error));
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
                    ctx
                      .replyWithDocument(
                        documentResponse.document,
                        documentResponse.extra
                      )
                      .catch((error) => this.onError(error));
                  } else {
                    ctx
                      .reply(this.messageService.getErrorMessage(error), extra)
                      .catch((error) => this.onError(error));
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

  private validatorCommands<T>(type: ValidatorType): void {
    const validator = this.validators[type];
    const { plural, singular } = VALIDATOR_TITLE[type];

    const listCommand = `list_${plural}`;
    const addCommand = `add_${singular}`;
    const removeCommand = `remove_${singular}`;

    this.bot.command(listCommand, (ctx) => {
      if (this.adminService.isAdmin(ctx.chat.type, ctx.chat.id)) {
        const elements = validator
          .listElements()
          .map((element) => validator.format(element));
        if (elements.length > 0) {
          ctx.replyWithDocument(
            {
              source: Buffer.from(elements.join('\n\n'), 'utf-8'),
              filename: `${plural}.txt`,
            },
            { caption: `${elements.length} items` }
          );
        } else {
          ctx.reply('No item found');
        }
      }
    });
    this.bot.command(addCommand, (ctx) => {
      if (this.adminService.isAdmin(ctx.chat.type, ctx.chat.id)) {
        const value = ctx.message.text.substring(1 + addCommand.length).trim();
        const item = validator.addElement(value);
        if (item) {
          ctx.replyWithHTML(
            `Element added successfully:\n<code>${validator.format(
              item
            )}</code>`
          );
        } else {
          const formats = validator
            .expectedFormats()
            .map((format) => `<code>${format}</code>`);
          ctx.replyWithHTML(
            `Item could not be added:\n<code>${value}</code>\nSend the item as follows:\n${formats.join(
              '\nOr\n'
            )}`
          );
        }
      }
    });
    this.bot.command(removeCommand, (ctx) => {
      if (this.adminService.isAdmin(ctx.chat.type, ctx.chat.id)) {
        const value = ctx.message.text
          .substring(1 + removeCommand.length)
          .trim();
        const item = validator.removeElement(value);
        if (item) {
          ctx.replyWithHTML(
            `Element removed successfully:\n<code>${validator.format(
              item
            )}</code>`
          );
        } else {
          const formats = validator
            .expectedFormats()
            .map((format) => `<code>${format}</code>`);
          ctx.replyWithHTML(
            `Item could not be removed:\n<code>${value}</code>\nSend the item as follows:\n${formats.join(
              '\nOr\n'
            )}`
          );
        }
      }
    });
  }

  private safeHandling(unsafeFunction: () => void): void {
    try {
      unsafeFunction();
    } catch (e) {
      console.error('Unexpected error', e);
    }
  }

  private onError(error: unknown): void {
    this.statisticsService
      .getStats()
      .increaseErrorCount(
        'Error sending message: ' + this.messageService.getErrorMessage(error)
      );
    console.error('Error sending message', error);
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

  private supportedSites(): string {
    return 'Amazon/Audible/Scribd/Storytel/Archive';
  }

  private smallHelpMessage(): string {
    return (
      'Send me an ' +
      this.supportedSites() +
      ' link to get a well-formatted request ready to be posted in groups.'
    );
  }

  private helpMessage(): string {
    return (
      this.smallHelpMessage() +
      ' You can then forward the same request to the group.' +
      '\n\n' +
      'You can use me inline as well. Send /inline for more information.' +
      '\n\n' +
      'Send /support to get information on how to support bot developer.' +
      '\n\n' +
      'Send /dmca to get information on DMCA protected titles, authors, and publishers.'
    );
  }

  private inlineExtra(messageId: number): ExtraAnimation {
    return {
      reply_to_message_id: messageId,
      caption: this.inlineHelp(),
      parse_mode: 'HTML',
    };
  }

  private inlineHelp(): string {
    let help = '<b>How to use the bot inline</b>';
    help += '\n\n';

    help +=
      '1) Write the bot name <code>@ebooks_request_generator_bot</code> and add <b>1 space</b>.';
    help += '\n\n';

    help += '2) Copy and paste ' + this.supportedSites() + ' link.';
    help += '\n\n';

    help +=
      '✅ <code>@ebooks_request_generator_bot https://www.amazon.com/dp/B07NYBL322</code>\n';
    help +=
      '❌ <code>@ebooks_request_generator_bothttps://www.amazon.com/dp/B07NYBL322</code>';
    help += '\n\n';

    help +=
      '3) <b>Wait</b> until the bot shows a popup with the book information.';
    help += '\n\n';

    help += '4) Click the popup.';

    return help;
  }

  private supportHelp(): string {
    let help = '<b>How to support bot developer</b>';
    help += '\n';

    help +=
      'This is how you can support my work by buying something on Amazon.';
    help += '\n\n';

    help += '1) Send me <code>/support</code> and add <b>1 space</b>.';
    help += '\n\n';

    help += '2) Copy and paste the Amazon link of whatever you want to buy.';
    help += '\n\n';

    help +=
      '✅ <code>/support https://www.amazon.com/Colgate-Advanced-Optic-Toothbrush-Medium/dp/B07S9GV83R</code>\n';
    help +=
      '❌ <code>/supporthttps://www.amazon.com/Colgate-Advanced-Optic-Toothbrush-Medium/dp/B07S9GV83R</code>';
    help += '\n\n';

    help += 'The bot will reply with a custom link.';
    help += '\n';

    help += '1) Click the link.';
    help += '\n';

    help += '2) Add the object to your busket.';
    help += '\n';

    help += '3) Procede to checkout.';
    help += '\n\n';

    help += '<b>Thank you for your support!</b>';
    help += '\n\n\n';

    help +=
      'Click <a href="https://affiliate-program.amazon.com/welcome/getstarted">here</a> if you want to understand how this helps me.';

    return help;
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
