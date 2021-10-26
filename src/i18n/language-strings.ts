export class LanguageStrings {
  private static readonly LANGUAGE_KEY = 'language';
  private static readonly PUBLISHER_KEY = 'publisher';

  private strings: Record<string, string>;
  /**
   * Strings with translations
   *
   * Key: translation
   * Value: original key
   *
   * Example:
   * {
   *  "lingua": "language",
   *  "editore": "publisher"
   * }
   */
  private reverseStrings: Record<string, string>;

  constructor(language: string, publisher: string) {
    this.strings = {};
    this.strings[LanguageStrings.LANGUAGE_KEY] = language;
    this.strings[LanguageStrings.PUBLISHER_KEY] = publisher;

    this.reverseStrings = {};
    this.reverseStrings[language] = LanguageStrings.LANGUAGE_KEY;
    this.reverseStrings[publisher] = LanguageStrings.PUBLISHER_KEY;
  }

  getKey(translation: string): string {
    let key: string | null = this.reverseStrings[translation];

    if (key == null) {
      throw 'String ' + translation + ' not supported';
    }

    return key;
  }

  getTranslation(key: string): string {
    let translation: string | null = this.strings[key];

    if (translation == null) {
      throw 'String ' + key + ' not supported';
    }

    return translation;
  }
}
