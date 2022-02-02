import { HTMLElement } from 'node-html-parser';
import { URL } from 'url';

import { NullableHtmlElement } from '../../../model/html/nullable-html-element';
import {
  ScribdAdditionalInformationWrapper,
  ScribdAlternativeInformation,
  ScribdInformation,
  ScribdInformationI18n,
  ScribdLanguage,
} from '../../../model/resolver/scribd-information';
import { SiteResolver } from '../../../model/resolver/site-resolver.enum';
import { Message } from '../../../model/telegram/message';
import { HtmlUtil } from '../../../util/html-util';
import { I18nUtil } from '../../../util/i18n-util';
import { AbstractResolver } from '../abstract-resolver';
import { ScribdAuthor } from './../../../model/resolver/scribd-information';
import { Format } from './../../../model/telegram/format.enum';
import { Source } from './../../../model/telegram/source.enum';
import { StatisticsService } from './../../statistics/statistic.service';

export class ScribdResolverService extends AbstractResolver {
  private static readonly CONTENT_ID = 'script[type="application/ld+json"]';
  private static readonly ALTERNATIVE_CONTENT_ID =
    'script[data-hypernova-key="contentpreview"]';
  private static readonly LANGUAGES: Record<string, string> = {
    ab: 'abkhazian',
    aa: 'afar',
    af: 'afrikaans',
    ak: 'akan',
    sq: 'albanian',
    am: 'amharic',
    ar: 'arabic',
    an: 'aragonese',
    hy: 'armenian',
    as: 'assamese',
    av: 'avaric',
    ae: 'avestan',
    ay: 'aymara',
    az: 'azerbaijani',
    bm: 'bambara',
    ba: 'bashkir',
    eu: 'basque',
    be: 'belarusian',
    bn: 'bengali',
    bi: 'bislama',
    bs: 'bosnian',
    br: 'breton',
    bg: 'bulgarian',
    my: 'burmese',
    ca: 'catalan',
    ch: 'chamorro',
    ce: 'chechen',
    ny: 'chichewa',
    zh: 'chinese',
    cv: 'chuvash',
    kw: 'cornish',
    co: 'corsican',
    cr: 'cree',
    hr: 'croatian',
    cs: 'czech',
    da: 'danish',
    dv: 'divehi',
    nl: 'dutch',
    dz: 'dzongkha',
    en: 'english',
    eo: 'esperanto',
    et: 'estonian',
    ee: 'ewe',
    fo: 'faroese',
    fj: 'fijian',
    fi: 'finnish',
    fr: 'french',
    ff: 'fulah',
    gl: 'galician',
    ka: 'georgian',
    de: 'german',
    el: 'greek',
    gn: 'guarani',
    gu: 'gujarati',
    ht: 'haitian',
    ha: 'hausa',
    he: 'hebrew',
    hz: 'herero',
    hi: 'hindi',
    ho: 'hirimotu',
    hu: 'hungarian',
    ia: 'interlingua',
    id: 'indonesian',
    ie: 'interlingue',
    ga: 'irish',
    ig: 'igbo',
    ik: 'inupiaq',
    io: 'ido',
    is: 'icelandic',
    it: 'italian',
    iu: 'inuktitut',
    ja: 'japanese',
    jv: 'javanese',
    kl: 'kalaallisut',
    kn: 'kannada',
    kr: 'kanuri',
    ks: 'kashmiri',
    kk: 'kazakh',
    km: 'centralkhmer',
    ki: 'kikuyu',
    rw: 'kinyarwanda',
    ky: 'kirghiz',
    kv: 'komi',
    kg: 'kongo',
    ko: 'korean',
    ku: 'kurdish',
    kj: 'kuanyama',
    la: 'latin',
    lb: 'luxembourgish',
    lg: 'ganda',
    li: 'limburgan',
    ln: 'lingala',
    lo: 'lao',
    lt: 'lithuanian',
    lu: 'lubakatanga',
    lv: 'latvian',
    gv: 'manx',
    mk: 'macedonian',
    mg: 'malagasy',
    ms: 'malay',
    ml: 'malayalam',
    mt: 'maltese',
    mi: 'maori',
    mr: 'marathi',
    mh: 'marshallese',
    mn: 'mongolian',
    na: 'nauru',
    nv: 'navajo',
    nd: 'northndebele',
    ne: 'nepali',
    ng: 'ndonga',
    nb: 'norwegianbokmål',
    nn: 'norwegiannynorsk',
    no: 'norwegian',
    ii: 'sichuanyi',
    nr: 'south ndebele',
    oc: 'occitan',
    oj: 'ojibwa',
    cu: 'churchslavic',
    om: 'oromo',
    or: 'oriya',
    os: 'ossetian',
    pa: 'punjabi',
    pi: 'pali',
    fa: 'persian',
    pl: 'polish',
    ps: 'pashto',
    pt: 'portuguese',
    qu: 'quechua',
    rm: 'romansh',
    rn: 'rundi',
    ro: 'romanian',
    ru: 'russian',
    sa: 'sanskrit',
    sc: 'sardinian',
    sd: 'sindhi',
    se: 'northernsami',
    sm: 'samoan',
    sg: 'sango',
    sr: 'serbian',
    gd: 'gaelic',
    sn: 'shona',
    si: 'sinhala',
    sk: 'slovak',
    sl: 'slovenian',
    so: 'somali',
    st: 'southern sotho',
    es: 'spanish',
    su: 'sundanese',
    sw: 'swahili',
    ss: 'swati',
    sv: 'swedish',
    ta: 'tamil',
    te: 'telugu',
    tg: 'tajik',
    th: 'thai',
    ti: 'tigrinya',
    bo: 'tibetan',
    tk: 'turkmen',
    tl: 'tagalog',
    tn: 'tswana',
    to: 'tonga',
    tr: 'turkish',
    ts: 'tsonga',
    tt: 'tatar',
    tw: 'twi',
    ty: 'tahitian',
    ug: 'uighur',
    uk: 'ukrainian',
    ur: 'urdu',
    uz: 'uzbek',
    ve: 'venda',
    vi: 'vietnamese',
    vo: 'volapük',
    wa: 'walloon',
    cy: 'welsh',
    wo: 'wolof',
    fy: 'westernfrisian',
    xh: 'xhosa',
    yi: 'yiddish',
    yo: 'yoruba',
    za: 'zhuang',
    zu: 'zulu',
  };

  constructor(statisticsService: StatisticsService) {
    super(statisticsService);
  }

  extractMessages(url: URL, html: HTMLElement): Promise<Message[]> {
    return new Promise<Message[]>((resolve) => {
      const content: HTMLElement[] = html.querySelectorAll(
        ScribdResolverService.CONTENT_ID
      );

      const additionalContent: NullableHtmlElement = html.querySelector(
        ScribdResolverService.ALTERNATIVE_CONTENT_ID
      );

      this.checkRequiredElements([additionalContent]);

      let information: ScribdInformation | null = null;

      // check main content
      if (content.length > 0) {
        information = this.getScribdInformation(content);
      }

      // otherwise get from alternative
      const informationI18n: ScribdInformationI18n =
        this.getScribdAdditionalInformation(additionalContent as HTMLElement);

      const languages: ScribdLanguage[] = informationI18n.languages;

      // no information found
      if (information == null) {
        information = informationI18n.information;
      }

      // prepare message
      const message: Message = new Message(SiteResolver.SCRIBD, url);

      // main info
      message.setTitle(information.name);

      if (typeof information.author == 'string') {
        message.addAuthor(information.author);
      } else {
        const scribdAuthors: ScribdAuthor[] = information.author;
        for (const author of scribdAuthors) {
          message.addAuthor(author.name);
        }
      }

      message.setPublisher(information.publisher);

      message.setPublicationDate(new Date(information.datePublished));

      // tags
      message.setSource(Source.SCRIBD);
      if (information['@type'] === 'Audiobook') {
        message.setFormat(Format.AUDIOBOOK);
      }

      this.setLanguage(message, information.inLanguage, languages);

      resolve([message]);
    });
  }

  private getScribdInformation(
    content: HTMLElement[]
  ): ScribdInformation | null {
    let information: ScribdInformation | null = null;

    for (let i = 0; i < content.length && information == null; i++) {
      const contentString = HtmlUtil.getRawText(content[i]);

      const informationItems: ScribdInformation[] = JSON.parse(contentString);

      for (let k = 0; k < informationItems.length && information == null; k++) {
        const tempInformation: ScribdInformation = informationItems[k];
        if (
          tempInformation['@type'] === 'Book' ||
          tempInformation['@type'] === 'Audiobook'
        ) {
          information = tempInformation;
        }
      }
    }

    return information;
  }

  private getScribdAdditionalInformation(
    contentElement: HTMLElement
  ): ScribdInformationI18n {
    let information: ScribdAlternativeInformation | null = null;

    const contentString = HtmlUtil.getRawText(contentElement);

    const content: ScribdAdditionalInformationWrapper = JSON.parse(
      this.sanitizeContentString(contentString)
    );

    if (
      content != undefined &&
      content.contentItem != undefined &&
      content.contentItem.title != undefined
    ) {
      information = content.contentItem;
    } else {
      throw 'Error parsing page. Cannot get scribd information.';
    }

    if (
      information.contentType !== 'book' &&
      information.contentType !== 'audiobook'
    ) {
      throw 'The product is neither an ebook nor an audiobook.';
    }

    return {
      information: {
        '@type': information.contentType === 'book' ? 'Book' : 'Audiobook',
        name: information.title,
        inLanguage: I18nUtil.ENGLISH,
        author: information.author.name,
        publisher: information.publisher.name,
        datePublished: information.releaseDate,
      },
      languages: content.i18n.languages,
    };
  }

  private sanitizeContentString(content: string): string {
    return content.replace('<!--', '').replace('-->', '');
  }

  private setLanguage(
    message: Message,
    inLanguage: string,
    languages: ScribdLanguage[]
  ): void {
    const languageFound: ScribdLanguage | undefined = languages.find(
      (l: ScribdLanguage) => l.prefix === inLanguage
    );

    if (languageFound != undefined) {
      const language: string = languageFound.name.toLowerCase();
      if (this.isLanguageTagRequired(language)) {
        message.setLanguage(this.getLanguageTag(language));
      }
    } else {
      const language: string | undefined =
        ScribdResolverService.LANGUAGES[inLanguage];
      if (this.isLanguageTagRequired(language)) {
        message.setLanguage(language);
      }
    }
  }

  private getLanguageTag(language: string): string {
    let result: string = language;
    switch (result) {
      case 'español':
        result = 'spanish';
        break;
      case 'português':
        result = 'portuguese';
        break;
      case 'Deutsch':
        result = 'german';
        break;
      case 'français':
        result = 'french';
        break;
      case 'pусский':
        result = 'russian';
        break;
      case 'italiano':
        result = 'italian';
        break;
      case 'română':
        result = 'romanian';
        break;
      case 'bahasa indonesia':
        result = 'indonesian';
        break;
    }

    return result;
  }
}
