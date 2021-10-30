import { LanguageStrings } from './language-strings';

export class I18nUtil {
  public static readonly ENGLISH: string = 'english';

  private static readonly LANGUAGES: Record<string, LanguageStrings> = {
    '.us': new LanguageStrings('language', 'publisher', {
      english: I18nUtil.ENGLISH,
      italian: 'italian',
      german: 'german',
    }),
    '.uk.co': new LanguageStrings('language', 'publisher', {
      english: I18nUtil.ENGLISH,
      italian: 'italian',
      german: 'german',
    }),
    '.it': new LanguageStrings('lingua', 'editore', {
      english: 'inglese',
      italian: 'italiano',
      german: 'tedesco',
    }),
    '.de': new LanguageStrings('sprache', 'herausgeber', {
      english: 'englisch',
      italian: 'italienisch',
      german: 'deutsch',
    }),
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
