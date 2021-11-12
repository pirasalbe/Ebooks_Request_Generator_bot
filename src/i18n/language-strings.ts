import { Languages } from './languages';
import { Strings } from './strings';

export class LanguageStrings {
  public static readonly LANGUAGE_KEY = 'language';
  public static readonly PUBLISHER_KEY = 'publisher';
  public static readonly PUBLICATION_DATE_KEY = 'publicationDate';
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
    this.strings[LanguageStrings.PUBLICATION_DATE_KEY] =
      strings.publicationDate;
    this.strings[LanguageStrings.ASSOCIATED_NAMES_KEY] =
      strings.associatedNames;
    this.strings[LanguageStrings.ASIN_KEY] = strings.asin;

    this.reverseStrings = {};
    this.reverseStrings[strings.language] = LanguageStrings.LANGUAGE_KEY;
    this.reverseStrings[strings.publisher] = LanguageStrings.PUBLISHER_KEY;
    this.reverseStrings[strings.publicationDate] =
      LanguageStrings.PUBLICATION_DATE_KEY;
    this.reverseStrings[strings.associatedNames] =
      LanguageStrings.ASSOCIATED_NAMES_KEY;
    this.reverseStrings[strings.asin] = LanguageStrings.ASIN_KEY;

    this.addValuesFromObject(languages);
    this.addValuesFromObject(strings.shortMonths);
    this.addValuesFromObject(strings.months);
  }

  private addValuesFromObject(object: any): void {
    for (const key of Object.keys(object)) {
      const value: string = (object as any)[key];
      this.strings[key] = value;
      this.reverseStrings[value] = key;
    }
  }

  getKey(translation: string): string | null {
    return this.reverseStrings[translation];
  }

  getTranslation(key: string): string | null {
    return this.strings[key];
  }
}
