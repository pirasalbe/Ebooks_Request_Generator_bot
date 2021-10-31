import { LanguageStrings } from './language-strings';

export class I18nUtil {
  public static readonly ENGLISH: string = 'english';

  private static readonly LANGUAGES: Record<string, LanguageStrings> = {
    '.us': new LanguageStrings('language', 'publisher', {
      english: I18nUtil.ENGLISH,
      italian: 'italian',
      german: 'german',
      french: 'french',
      spanish: 'spanish',
    }),
    '.uk.co': new LanguageStrings('language', 'publisher', {
      english: I18nUtil.ENGLISH,
      italian: 'italian',
      german: 'german',
      french: 'french',
      spanish: 'spanish',
    }),
    '.in': new LanguageStrings('language', 'publisher', {
      english: I18nUtil.ENGLISH,
      italian: 'italian',
      german: 'german',
      french: 'french',
      spanish: 'spanish',
    }),
    '.it': new LanguageStrings('lingua', 'editore', {
      english: 'inglese',
      italian: 'italiano',
      german: 'tedesco',
      french: 'francese',
      spanish: 'spagnolo',
    }),
    '.de': new LanguageStrings('sprache', 'herausgeber', {
      english: 'englisch',
      italian: 'italienisch',
      german: 'deutsch',
      french: 'französisch',
      spanish: 'spanisch',
    }),
    '.fr': new LanguageStrings('langue', 'éditeur', {
      english: 'inglés',
      italian: 'italien',
      german: 'allemand',
      french: 'français',
      spanish: 'espagnol',
    }),
    '.es': new LanguageStrings('idioma', 'editorial', {
      english: 'inglés',
      italian: 'italiano',
      german: 'aleman',
      french: 'francés',
      spanish: 'español',
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
