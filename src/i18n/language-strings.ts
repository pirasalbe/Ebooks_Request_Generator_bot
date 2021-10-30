import { Languages } from './languages';

export class LanguageStrings {
  public static readonly LANGUAGE_KEY = 'language';
  public static readonly PUBLISHER_KEY = 'publisher';

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

  constructor(language: string, publisher: string, languages: Languages) {
    this.strings = {};
    this.strings[LanguageStrings.LANGUAGE_KEY] = language;
    this.strings[LanguageStrings.PUBLISHER_KEY] = publisher;

    this.reverseStrings = {};
    this.reverseStrings[language] = LanguageStrings.LANGUAGE_KEY;
    this.reverseStrings[publisher] = LanguageStrings.PUBLISHER_KEY;

    for (const languageKey of Object.keys(languages)) {
      const value: string = (languages as any)[languageKey];
      this.strings[languageKey] = value;
      this.reverseStrings[value] = languageKey;
    }
  }

  getKey(translation: string): string | null {
    return this.reverseStrings[translation];
  }

  getTranslation(key: string): string | null {
    return this.strings[key];
  }
}
