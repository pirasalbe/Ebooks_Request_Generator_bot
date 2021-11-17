export class HostStatistics {
  private requests: number;
  private errors: number;

  constructor() {
    this.requests = 0;
    this.errors = 0;
  }

  incrementRequestCount(): void {
    this.requests += 1;
  }

  incrementErrorCount(): void {
    this.errors += 1;
  }

  toString(): string {
    let result = '<b>Requests</b>: ' + this.requests;
    result += '\n';
    result += '<b>Errors</b>: ' + this.errors;
    return result;
  }
}
