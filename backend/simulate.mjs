import { randomInt } from "node:crypto";
import {
    config,
    strips,
    gridFromStops,
    calculateWin,
} from "./engine.mjs";

const spins = Number(process.argv[2] ?? 1000000);
const bet = Number(process.argv[3] ?? config.minBet);

if (!Number.isSafeInteger(spins) || spins <= 0) {
    throw new Error("Spin count must be a positive integer");
}

if (
    !Number.isSafeInteger(bet) ||
    bet < config.minBet ||
    bet > config.maxBet ||
    bet % config.betStep !== 0
) {
    throw new Error("Invalid bet");
}

const totalBet = spins * bet;

if (!Number.isSafeInteger(totalBet)) {
    throw new Error("Total bet exceeds the safe integer range");
}

let totalPaid = 0;
let winningSpins = 0;
let profitableSpins = 0;
let breakEvenSpins = 0;
let maxWin = 0;

// Welford's algorithm for payout variance.
let mean = 0;
let squaredDifferences = 0;

const symbolStats = new Map(
    Object.keys(config.paytable).map((symbol) => [
        symbol,
        { winningLines: 0, paid: 0 },
    ]),
);

const started = performance.now();

for (let i = 0; i < spins; i++) {
    const stops = strips.map((strip) => randomInt(strip.length));
    const grid = gridFromStops(stops);
    const result = calculateWin(grid, bet);
    const payout = result.totalWin;

    totalPaid += payout;

    if (!Number.isSafeInteger(totalPaid)) {
        throw new Error("Total payout exceeds the safe integer range");
    }

    if (payout > 0) winningSpins++;
    if (payout > bet) profitableSpins++;
    if (payout === bet) breakEvenSpins++;

    maxWin = Math.max(maxWin, payout);

    const payoutRatio = payout / bet;
    const delta = payoutRatio - mean;

    mean += delta / (i + 1);
    squaredDifferences += delta * (payoutRatio - mean);

    for (const line of result.winningLines) {
        const stats = symbolStats.get(line.symbol);
        stats.winningLines++;
        stats.paid += line.payout;
    }
}

const percentage = (count) =>
    `${((count / spins) * 100).toFixed(2)}%`;

const rtp = (totalPaid / totalBet) * 100;

console.table({
    Spins: spins,
    "Bet per spin": bet,
    "Total wagered": totalBet,
    "Total paid": totalPaid,
    "Player net": totalPaid - totalBet,
    "Observed RTP": `${rtp.toFixed(2)}%`,
    "Spins with any payout": percentage(winningSpins),
    "Spins paying more than bet": percentage(profitableSpins),
    "Break-even spins": percentage(breakEvenSpins),
    "Largest observed payout": maxWin,
    "Largest observed multiplier": `${(maxWin / bet).toFixed(2)}x`,
    "Duration (seconds)": (
        (performance.now() - started) / 1000
    ).toFixed(2),
});

if (spins > 1) {
    const variance = squaredDifferences / (spins - 1);
    const margin = 1.96 * Math.sqrt(variance / spins) * 100;

    console.log(
        "Approximate 95% RTP interval:",
        `${Math.max(0, rtp - margin).toFixed(2)}%`,
        "to",
        `${(rtp + margin).toFixed(2)}%`,
    );
}

console.log("\nWinning lines by symbol:");

console.table(
    [...symbolStats.entries()].map(([symbol, stats]) => ({
        symbol,
        winningLines: stats.winningLines,
        paid: stats.paid,
    })),
);