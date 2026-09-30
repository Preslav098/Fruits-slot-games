import {
  ALL_SYMBOLS,
  type SymbolType,
} from "../interfaces/SymbolType";

export function visualStrip(length = 32): SymbolType[] {
  return Array.from(
    { length },
    (_, index) => ALL_SYMBOLS[index % ALL_SYMBOLS.length],
  );
}

export class ReelStrip {
  private data: SymbolType[];

  constructor(symbols: readonly SymbolType[]) {
    if (symbols.length === 0) {
      throw new Error("Reel strip cannot be empty");
    }

    this.data = [...symbols];
  }

  get length(): number {
    return this.data.length;
  }

  get symbols(): readonly SymbolType[] {
    return this.data;
  }

  private wrap(position: number): number {
    return (
      ((Math.floor(position) % this.length) + this.length) %
      this.length
    );
  }

  getWindow(position: number, count: number): SymbolType[] {
    return Array.from(
      { length: count },
      (_, row) => this.data[this.wrap(position + row)],
    );
  }

  setWindow(
    position: number,
    symbols: readonly SymbolType[],
  ): void {
    symbols.forEach((symbol, row) => {
      this.data[this.wrap(position + row)] = symbol;
    });
  }
}