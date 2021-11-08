import { Languages } from './languages';
import { Strings } from './strings';

export class LanguageStrings {
  public static readonly LANGUAGE_KEY = 'language';
  public static readonly PUBLISHER_KEY = 'publisher';
  public static readonly ASSOCIATED_NAMES_KEY = 'associated-names';
  public static readonly ASIN_KEY = 'asin';

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

  constructor(strings: Strings, languages: Languages) {
    this.strings = {};
    this.strings[LanguageStrings.LANGUAGE_KEY] = strings.language;
    this.strings[LanguageStrings.PUBLISHER_KEY] = strings.publisher;
    this.strings[LanguageStrings.ASSOCIATED_NAMES_KEY] =
      strings.associatedNames;
    this.strings[LanguageStrings.ASIN_KEY] = strings.asin;

    this.reverseStrings = {};
    this.reverseStrings[strings.language] = LanguageStrings.LANGUAGE_KEY;
    this.reverseStrings[strings.publisher] = LanguageStrings.PUBLISHER_KEY;
    this.reverseStrings[strings.associatedNames] =
      LanguageStrings.ASSOCIATED_NAMES_KEY;
    this.reverseStrings[strings.asin] = LanguageStrings.ASIN_KEY;

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
