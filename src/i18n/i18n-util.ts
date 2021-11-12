import { LanguageStrings } from './language-strings';

export class I18nUtil {
  public static readonly ENGLISH: string = 'english';

  private static readonly LANGUAGES: Record<string, LanguageStrings> = {
    en: new LanguageStrings(
      {
        language: 'language',
        publisher: 'publisher',
        publicationDate: 'Publication date',
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
        french: 'french',
        spanish: 'spanish',
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
        french: 'francese',
        spanish: 'spagnolo',
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
        french: 'französisch',
        spanish: 'spanisch',
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
        french: 'français',
        spanish: 'espagnol',
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
        french: 'francés',
        spanish: 'español',
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
