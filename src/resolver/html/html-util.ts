import { HTMLElement, parse } from 'node-html-parser';

export class HtmlUtil {
  private constructor() {
    // util class
  }

  static parseHTML(data: string): HTMLElement {
    return parse(data);
  }

  static getRawText(element: HTMLElement): string {
    return element.rawText.trim();
  }

  static getTextContent(element: HTMLElement): string {
    return element.textContent.trim();
  }
}
