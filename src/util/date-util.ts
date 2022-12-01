export class DateUtil {
  private constructor() {
    // util class
  }

  public static addHours(date: Date, hours: number): Date {
    date.setTime(date.getTime() + hours * 60 * 60 * 1000);
    return date;
  }

  public static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  public static dateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
