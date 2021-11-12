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
