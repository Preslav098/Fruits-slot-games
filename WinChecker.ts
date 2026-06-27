import { PAYLINES } from "./Payline";
import { PAYTABLE } from "./PayTable.ts";
import { SymbolType } from "./SymbolType";
import type { WinningLine } from "./interfaces/WinningLine.ts";
import type { WinResult } from "./interfaces/WinResult.ts";

export class WinChecker {
    static calculateWin(grid: SymbolType[][], bet: number): WinResult {
        let totalWin = 0;
        const winningLines: WinningLine[] = [];

        for (let paylineIndex = 0; paylineIndex < PAYLINES.length; paylineIndex++) {
            const payline = PAYLINES[paylineIndex];

            const lineSymbols = payline.map((rowIndex, reelIndex) => {
                return grid[reelIndex]?.[rowIndex];
            });

            const firstSymbol = lineSymbols[0];

            if (!firstSymbol) continue;

            let matchCount = 1;

            for (let i = 1; i < lineSymbols.length; i++) {
                if (lineSymbols[i] === firstSymbol) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const multiplier = PAYTABLE[firstSymbol];
                const payout = bet * multiplier * (matchCount - 2);

                totalWin += payout;

                winningLines.push({
                    paylineIndex,
                    symbol: firstSymbol,
                    count: matchCount,
                    payout,
                });
            }
        }

        return {
            totalWin,
            winningLines,
        };
    }
}