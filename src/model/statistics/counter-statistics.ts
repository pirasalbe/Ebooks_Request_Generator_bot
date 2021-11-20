export class CounterStatistics {
  protected count: number;

  constructor() {
    this.count = 0;
  }

  incrementCount(): void {
    this.count += 1;
  }

  toString(): string {
    return String(this.count);
  }
}
