import { Context, Markup, Telegraf, Telegram } from 'telegraf';
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
          this.resolve(this.extractUrlFromText(ctx.inlineQuery.query))
            .then((messages: Message[]) => {
              const inlineResults: InlineQueryResult[] = [];

              for (const message of messages) {
                inlineResults.push(
                  this.inlineResult(
                    'Request ' + message.toTileString(),
                    message.toString(),
                    message.toDetailsString(),
                    BotService.SUCCESSFULL_THUMB_URL
                  )
                );
              }

              ctx.answerInlineQuery(inlineResults);
            })
            .catch((error: string) => {
              ctx.answerInlineQuery([
                this.inlineResult(
                  'Error!',
                  String(error),
                  String(error),
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
        // avoid messages from the bot
        if (!this.isMessageFromBot(ctx.message.via_bot, ctx.botInfo)) {
          ctx
            .reply('Processing...')
            .then((loader: TelegramMessage.TextMessage) => {
              this.resolve(
                this.extractUrl(ctx.message.text, ctx.message.entities)
              )
                .then((messages: Message[]) => {
                  ctx.deleteMessage(loader.message_id);
                  for (const message of messages) {
                    ctx.reply(message.toString(), {
                      disable_web_page_preview: true,
                      parse_mode: 'HTML',
                      ...Markup.inlineKeyboard([
                        Markup.button.switchToChat('Forward', ctx.message.text),
                      ]),
                    });
                  }
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

  private resolve(text: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      try {
        this.resolverService
          .resolve(text)
          .then((messages: Message[]) => {
            resolve(messages);
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
}
