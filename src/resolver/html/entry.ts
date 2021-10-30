export class Entry<K, T> {
  private key: K;
  private value: T;

  constructor(key: K, value: T) {
    this.key = key;
    this.value = value;
  }

  getKey(): K {
    return this.key;
  }

  getValue(): T {
    return this.value;
  }

  toString(): string {
    return '[' + this.key + ']: [' + this.value + ']';
  }
}
