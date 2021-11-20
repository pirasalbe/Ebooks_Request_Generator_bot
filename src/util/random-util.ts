export class RandomUtil {
  private constructor() {
    // util class
  }

  public static getRandom(max: number): number {
    return Math.floor(Math.random() * max);
  }
}
