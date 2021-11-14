export class Validation {
  private valid: boolean;
  private error: string | null;

  private constructor(valid: boolean, error: string | null) {
    this.valid = valid;
    this.error = error;
  }

  static valid(): Validation {
    return new Validation(true, null);
  }

  static invalid(error: string): Validation {
    return new Validation(false, error);
  }

  isValid(): boolean {
    return this.valid;
  }

  getError(): string | null {
    return this.error;
  }
}
