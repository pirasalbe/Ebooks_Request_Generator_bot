import { Message } from '../../../model/telegram/message';
import { Publisher } from '../../../model/validator/publisher';
import { Validation } from '../../../model/validator/validation';
import { FilesService, VALIDATOR_PATH } from '../../files/filesService';
import { AbstractValidator } from '../abstract-validator';

export class PublisherValidatorService extends AbstractValidator<Publisher> {
  private static readonly IMPRINT_SPACE: string = '- Imprint';
  private static readonly IMPRINT: string = '-Imprint';
  private static readonly MASK_PARAM: string = 'Publisher';

  public static readonly CHARS_PATTERN: RegExp = new RegExp('[a-z]');

  constructor(filesService: FilesService) {
    super(filesService);
  }

  protected getFilePath(): VALIDATOR_PATH {
    return 'publishers';
  }

  protected validateMessage(message: Message): Validation {
    let result: Validation = Validation.valid();

    const publisher: string | null = message.getPublisher();
    if (publisher != null) {
      const lowerCasePublisher = publisher.toLowerCase();
      const academicPublisher: Publisher | undefined = this.elements.find(
        (p: Publisher) => this.isAcademic(p, lowerCasePublisher)
      );
      if (academicPublisher != undefined) {
        result = Validation.invalid(
          this.getError(publisher, academicPublisher.imprint)
        );
      } else if (
        lowerCasePublisher.includes('university') &&
        lowerCasePublisher.includes('press')
      ) {
        result = Validation.invalid(this.getError(publisher));
      }
    }

    return result;
  }

  private isAcademic(publisher: Publisher, messagePublisher: string): boolean {
    let result = false;

    const publisherName = publisher.name.toLowerCase();
    if (publisherName == messagePublisher) {
      result = true;
    } else if (messagePublisher.startsWith(publisherName)) {
      const nextChar: string = messagePublisher.charAt(publisherName.length);
      result = !PublisherValidatorService.CHARS_PATTERN.test(nextChar);
    }

    return result;
  }

  private getError(publisher: string, imprint?: string): string {
    let error: string =
      'The publisher of your #request, ' +
      this.mask(publisher, PublisherValidatorService.MASK_PARAM);

    if (imprint) {
      error +=
        ' (imprint ' +
        this.mask(imprint, PublisherValidatorService.MASK_PARAM) +
        ')';
    }

    error += ", is academic and can't be requested here.";

    return error;
  }

  expectedFormats(): string[] {
    return [
      `Publisher`,
      `Publisher ${PublisherValidatorService.IMPRINT_SPACE} Imprint`,
    ];
  }

  parse(text: string): Publisher | undefined {
    const sanitizedString: string = text
      .replace('\\U0026', '&')
      .replace(
        PublisherValidatorService.IMPRINT_SPACE,
        PublisherValidatorService.IMPRINT
      );

    const hashTagIndex: number = sanitizedString.indexOf('#');

    // remove hashtag
    let publisherName: string = sanitizedString;
    if (hashTagIndex > -1) {
      publisherName = sanitizedString.substring(0, hashTagIndex);
    }

    let imprint: string | undefined = undefined;

    // split imprint and publisher
    const publisherParts: string[] = publisherName.split(
      PublisherValidatorService.IMPRINT
    );
    // publisher
    publisherName = publisherParts[0].trim();
    // imprint
    if (publisherParts.length > 1) {
      imprint = publisherParts[1].trim();
    }

    return { name: publisherName, imprint };
  }

  format(element: Publisher): string {
    const imprint = element.imprint
      ? ` ${PublisherValidatorService.IMPRINT_SPACE} ${element.imprint}`
      : '';
    return element.name + imprint;
  }

  protected equal(a: Publisher, b: Publisher): boolean {
    return (
      a.name.toLowerCase() === b.name.toLowerCase() && a.imprint === b.imprint
    );
  }

  protected compare(a: Publisher, b: Publisher): number {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }
}
