import { LanguageStrings } from './language-strings';

export class I18nUtil {
  private static languages: Record<string, LanguageStrings> = {
    '.us': new LanguageStrings('language', 'publisher'),
    '.uk.co': new LanguageStrings('language', 'publisher'),
    '.it': new LanguageStrings('lingua', 'editore'),
    '.de': new LanguageStrings('sprache', 'herausgeber'),
  };

  /**
   * Obtain key from a translation
   *
   * @param language Language id, such as '.it' or '.us'
   * @param translation Translation, such as 'Editore' or 'Publisher'
   * @returns Key
   */
  static getKey(language: string, translation: string): string {
    const languageStrings: LanguageStrings = this.languages[language];
    let key: string;

    if (languageStrings != null) {
      key = languageStrings.getKey(translation.toLowerCase());
    } else {
      throw 'Language ' + language + ' not supported';
    }

    return key;
  }
}
