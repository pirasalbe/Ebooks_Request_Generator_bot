export type ChatType = 'private' | 'group' | 'supergroup';

export class BotUtil {
  private constructor() {
    // util class
  }

  public static isPrivateChat(type: ChatType): boolean {
    return type === 'private';
  }
}
