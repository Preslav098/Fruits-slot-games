import type { WinningLine } from "./WinningLine.ts";

export interface WinResult {
    totalWin: number;
    winningLines: WinningLine[];
}