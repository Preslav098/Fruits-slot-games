import { SymbolType } from "../SymbolType.ts";

export interface WinningLine {
    paylineIndex: number;
    symbol: SymbolType;
    count: number;
    payout: number;
}