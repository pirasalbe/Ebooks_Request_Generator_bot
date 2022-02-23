import { LanguageStrings } from '../model/i18n/language-strings';

export class I18nUtil {
  public static readonly ENGLISH: string = 'english';

  private static readonly LANGUAGES: Record<string, LanguageStrings> = {
    en: new LanguageStrings(
      {
        language: 'language',
        publisher: 'publisher',
        publicationDate: 'publication date',
        associatedNames: 'associated-names',
        asin: 'asin',
        months: {
          0: 'january',
          1: 'february',
          2: 'march',
          3: 'april',
          4: 'may',
          5: 'june',
          6: 'july',
          7: 'august',
          8: 'september',
          9: 'october',
          10: 'november',
          11: 'december',
        },
        shortMonths: {
          0: 'jan',
          1: 'feb',
          2: 'mar',
          3: 'apr',
          4: 'may',
          5: 'jun',
          6: 'jul',
          7: 'aug',
          8: 'sep',
          9: 'oct',
          10: 'nov',
          11: 'dec',
        },
      },
      {
        english: I18nUtil.ENGLISH,
        italian: 'italian',
        german: 'german',
        dutch: 'dutch',
        french: 'french',
        spanish: 'spanish',
        portuguese: 'portuguese',
      }
    ),
    it: new LanguageStrings(
      {
        language: 'lingua',
        publisher: 'editore',
        publicationDate: 'data di pubblicazione',
        associatedNames: 'nomi-associati',
        asin: 'asin',
        months: {
          0: 'gennaio',
          1: 'febbraio',
          2: 'marzo',
          3: 'aprile',
          4: 'maggio',
          5: 'giugno',
          6: 'luglio',
          7: 'agosto',
          8: 'settembre',
          9: 'ottobre',
          10: 'novembre',
          11: 'dicembre',
        },
        shortMonths: {
          0: 'gen',
          1: 'feb',
          2: 'mar',
          3: 'apr',
          4: 'mag',
          5: 'giu',
          6: 'lug',
          7: 'ago',
          8: 'set',
          9: 'ott',
          10: 'nov',
          11: 'dic',
        },
      },
      {
        english: 'inglese',
        italian: 'italiano',
        german: 'tedesco',
        dutch: 'olandese',
        french: 'francese',
        spanish: 'spagnolo',
        portuguese: 'portoghese',
      }
    ),
    de: new LanguageStrings(
      {
        language: 'sprache',
        publisher: 'herausgeber',
        publicationDate: 'erscheinungstermin',
        associatedNames: 'assoziierte-namen',
        asin: 'asin',
        months: {
          0: 'januar',
          1: 'februar',
          2: 'märz',
          3: 'april',
          4: 'mai',
          5: 'juni',
          6: 'juli',
          7: 'august',
          8: 'september',
          9: 'oktober',
          10: 'november',
          11: 'dezember',
        },
        shortMonths: {
          0: 'jan',
          1: 'feb',
          2: 'mär',
          3: 'apr',
          4: 'mai',
          5: 'jun',
          6: 'jul',
          7: 'aug',
          8: 'sep',
          9: 'okt',
          10: 'nov',
          11: 'dez',
        },
      },
      {
        english: 'englisch',
        italian: 'italienisch',
        german: 'deutsch',
        dutch: 'niederländisch',
        french: 'französisch',
        spanish: 'spanisch',
        portuguese: 'portugiesisch',
      }
    ),
    fr: new LanguageStrings(
      {
        language: 'langue',
        publisher: 'éditeur',
        publicationDate: 'date de publication',
        associatedNames: 'noms-associés',
        asin: 'asin',
        months: {
          0: 'janvier',
          1: 'février',
          2: 'mars',
          3: 'avril',
          4: 'mai',
          5: 'juin',
          6: 'juillet',
          7: 'août',
          8: 'septembre',
          9: 'octobre',
          10: 'novembre',
          11: 'décembre',
        },
        shortMonths: {
          0: 'jan',
          1: 'fév',
          2: 'mar',
          3: 'avr',
          4: 'mai',
          5: 'jui',
          6: 'jui',
          7: 'aoû',
          8: 'sep',
          9: 'oct',
          10: 'nov',
          11: 'déc',
        },
      },
      {
        english: 'anglais',
        italian: 'italien',
        german: 'allemand',
        dutch: 'néerlandais',
        french: 'français',
        spanish: 'espagnol',
        portuguese: 'portugais',
      }
    ),
    es: new LanguageStrings(
      {
        language: 'idioma',
        publisher: 'editorial',
        publicationDate: 'fecha de publicación',
        associatedNames: 'nombres-asociados',
        asin: 'asin',
        months: {
          0: 'enero',
          1: 'febrero',
          2: 'marzo',
          3: 'abril',
          4: 'mayo',
          5: 'junio',
          6: 'julio',
          7: 'agosto',
          8: 'septiembre',
          9: 'octubre',
          10: 'noviembre',
          11: 'diciembre',
        },
        shortMonths: {
          0: 'ene',
          1: 'feb',
          2: 'mar',
          3: 'abr',
          4: 'may',
          5: 'jun',
          6: 'jul',
          7: 'ago',
          8: 'sep',
          9: 'oct',
          10: 'nov',
          11: 'dic',
        },
      },
      {
        english: 'inglés',
        italian: 'italiano',
        german: 'aleman',
        dutch: 'holandés',
        french: 'francés',
        spanish: 'español',
        portuguese: 'portugués',
      }
    ),
    pt: new LanguageStrings(
      {
        language: 'idioma',
        publisher: 'editora',
        publicationDate: 'data da publicação',
        associatedNames: 'nomes-associados',
        asin: 'asin',
        months: {
          0: 'janeiro',
          1: 'fevereiro',
          2: 'março',
          3: 'abril',
          4: 'maio',
          5: 'junho',
          6: 'julho',
          7: 'agosto',
          8: 'setembro',
          9: 'outubro',
          10: 'novembro',
          11: 'dezembro',
        },
        shortMonths: {
          0: 'jan',
          1: 'fev',
          2: 'mar',
          3: 'abr',
          4: 'mai',
          5: 'jun',
          6: 'jul',
          7: 'ago',
          8: 'set',
          9: 'out',
          10: 'nov',
          11: 'dez',
        },
      },
      {
        english: 'inglês',
        italian: 'italiano',
        german: 'alemão',
        dutch: 'holandês',
        french: 'francês',
        spanish: 'espanhol',
        portuguese: 'português',
      }
    ),
    nl: new LanguageStrings(
      {
        language: 'taal',
        publisher: 'uitgever',
        publicationDate: 'publicatiedatum',
        associatedNames: 'verwante-namen',
        asin: 'asin',
        months: {
          0: 'januari',
          1: 'februari',
          2: 'maart',
          3: 'april',
          4: 'mei',
          5: 'juni',
          6: 'juli',
          7: 'augustus',
          8: 'september',
          9: 'oktober',
          10: 'november',
          11: 'december',
        },
        shortMonths: {
          0: 'jan',
          1: 'feb',
          2: 'maa',
          3: 'apr',
          4: 'mei',
          5: 'jun',
          6: 'jul',
          7: 'aug',
          8: 'sep',
          9: 'okt',
          10: 'nov',
          11: 'dec',
        },
      },
      {
        english: 'engels',
        italian: 'italiaans',
        german: 'duits',
        dutch: 'nederlands',
        french: 'frans',
        spanish: 'spaans',
        portuguese: 'portugees',
      }
    ),
  };

  private constructor() {
    // util class
  }

  /**
   * Obtain key from a translation
   *
   * @param language Language id, such as '.it' or '.us'
   * @param translation Translation, such as 'Editore' or 'Publisher'
   * @returns Key
   */
  static getKey(language: string, translation: string): string | null {
    const languageStrings: LanguageStrings = I18nUtil.LANGUAGES[language];
    let key: string | null;

    if (languageStrings != null) {
      key = languageStrings.getKey(translation.toLowerCase());
    } else {
      throw 'Language ' + language + ' not supported';
    }

    return key;
  }
}
