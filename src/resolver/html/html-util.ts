import { HTMLElement } from 'node-html-parser';

export class HtmlUtil {
  private constructor() {
    // util class
  }

  static getRawText(element: HTMLElement): string {
    return element.rawText.trim();
  }

  static getTextContent(element: HTMLElement): string {
    return element.textContent.trim();
  }
}
