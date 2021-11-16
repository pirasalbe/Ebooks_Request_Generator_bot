export class Statistics {
  private requests: number;

  constructor() {
    this.requests = 0;
  }

  incrementRequestCount(): void {
    this.requests += 1;
  }

  toString(): string {
    return '<b>Requests</b>: ' + this.requests;
  }
}
