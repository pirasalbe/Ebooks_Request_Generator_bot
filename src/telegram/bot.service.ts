import { url } from 'inspector';
import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import { switchToCurrentChat } from 'telegraf/typings/button';
import { InlineKeyboardMarkup, InlineQueryResult, InlineQueryResultArticle, InputTextMessageContent, Update } from 'typegram';
import { Message } from '../resolver/message'
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
      ctx.replyWithHTML("Hey, " + ctx.from.first_name + " 👋" + this.helpMessage(), {
        disable_web_page_preview: true, ...Markup.inlineKeyboard([
          Markup.button.switchToCurrentChat('Make a Request', ''),
        ])
      }
      );
    });
    this.bot.help((ctx) => {
      ctx.replyWithHTML("Hey, " + ctx.from.first_name + " 👋" + this.helpMessage(), {
        disable_web_page_preview: true, ...Markup.inlineKeyboard([
          Markup.button.switchToCurrentChat('Make a Request', ''),
        ])
      }
      );
    });

    this.bot.on('inline_query', (ctx) => {
      if (ctx.inlineQuery.query != '') {
        this.resolve(ctx.inlineQuery.query)
          .then((message: Message) => {
            ctx.answerInlineQuery([
              this.inlineResult(
                'Request ' + Message.tags[0].charAt(0).toUpperCase() + Message.tags[0].slice(1),
                message.toString(),
                Message.title + '\n' + '',
                'https://telegra.ph/file/06d1f7c944004bb0dcef1.jpg',
                // TODO:
                // Markup.inlineKeyboard([
                // Markup.button.switchToCurrentChat('New Request', ''),
                // Markup.button.switchToCurrentChat('Edit Link', ctx.message.text)
                // ])
              ),
            ],
              {
                switch_pm_text: 'Use in PM',
                switch_pm_parameter: 'help'
              });
          })
          .catch((error: string) => {
            ctx.answerInlineQuery([this.inlineResult('Error!', error + "\n" + ctx.inlineQuery.query, error, 'https://www.downloadclipart.net/large/14121-warning-icon-design.png')]);
          });
      }
      else {
        ctx.answerInlineQuery([
          this.inlineResult(
            'Incomplete Request!',
            'Incomplete Request!',
            'Paste an amazon/audible link to request',
            'https://www.downloadclipart.net/large/14121-warning-icon-design.png', //for invalid requests
          ),
        ],
          {
            switch_pm_text: 'Use in PM',
            switch_pm_parameter: 'help'
          });
      }
    });

    this.bot.on('text', async (ctx) => {
      // Do not process via_bot messages
      if(ctx.message.via_bot) {
        return
      }
      let loader = await ctx.reply("Processing...")
      this.resolve(ctx.message.text)
        .then(async (message: Message) => {
          await ctx.telegram.editMessageText(ctx.from.id, loader.message_id, undefined, message.toString(), {
            parse_mode: 'HTML',
            disable_web_page_preview: true, ...Markup.inlineKeyboard([
              Markup.button.switchToCurrentChat('New Request', ''),
              Markup.button.switchToCurrentChat('Repost', ctx.message.text)
            ])
          }
          );
        })
        .catch((error: string) => {
          ctx.reply(error);
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

  private helpMessage(): string {
    return `\n\nSend me an amazon or audible link to get a well-formatted request ready to be posted in BookCrush:Requests group.

You can use me inline as well. Just click on the button below or send <code>@bkcrushreqbot amazon/audible-link</code>"`;
  }

  private inlineResult(
    title: string,
    message: string,
    description: string,
    thumb_url: string,
    // keyboard: InlineKeyboardMarkup
  ): InlineQueryResult {
    const content: InputTextMessageContent = {
      message_text: message,
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    };

    const result: InlineQueryResultArticle = {
      id: '1',
      type: 'article',
      title: title,
      input_message_content: content,
      description: description,
      thumb_url: thumb_url,
      // reply_markup: {inline_keyboard: keyboard} 
    };
    return result;
  }
}
