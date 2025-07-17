import { existsSync, readFileSync, writeFileSync } from 'fs';

export type VALIDATOR_PATH = 'titles' | 'authors' | 'publishers';
export type FILE_PATH = 'admins' | VALIDATOR_PATH;

export class FilesService {
  constructor(private path: string) {
    if (path === undefined) {
      throw new Error('Please specify the config path.');
    }
  }

  private getPath(filePath: FILE_PATH) {
    return `${this.path}/${filePath}.json`;
  }

  readFile<T>(filePath: FILE_PATH, defaultValue: T): T {
    const fullPath = this.getPath(filePath);
    if (!existsSync(fullPath)) {
      return defaultValue;
    }

    const file = readFileSync(fullPath, 'utf-8');

    return JSON.parse(file);
  }

  writeFile<T>(filePath: FILE_PATH, value: T): void {
    const fullPath = this.getPath(filePath);
    writeFileSync(fullPath, JSON.stringify(value));
  }
}
