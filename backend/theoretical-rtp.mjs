import { config, strips } from "./engine.mjs";

// За текущия модел:
// - независим избор на стоп за всеки рил;
// - еднаква вероятност за всеки стоп;
// - печалби за последователни символи отляво;
// - payout = bet × paytable[symbol][count];
// - без wild, scatter или бонуси.

const symbols = Object.keys(config.paytable);


if (strips.length < 3) {
    throw new Error("At least three reels are required");
}

const probabilities = strips.map((strip) => {
    const counts = new Map();

    for (const symbol of strip) {
        counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    }

    return new Map(
        [...counts.entries()].map(([symbol, count]) => [
            symbol,
            count / strip.length,
        ]),
    );
});

const rows = [];
let totalReturn = 0;

for (const symbol of symbols) {
    const payouts = config.paytable[symbol];
    let prefixProbability = 1;
    let returnPerLine = 0;

    for (let count = 1; count <= strips.length; count++) {
        prefixProbability *=
            probabilities[count - 1].get(symbol) ?? 0;

        if (count < 3) continue;

        // Exact match count: the next reel must differ.
        // At the last reel, no further condition is needed.
        const nextMatchProbability =
            count < strips.length
                ? probabilities[count].get(symbol) ?? 0
                : 0;

        const exactProbability =
            prefixProbability * (1 - nextMatchProbability);

        const payoutMultiplier = payouts[count];

        returnPerLine +=
            exactProbability * payoutMultiplier;

        rows.push({
            symbol,
            matches: count,
            "Probability per line": (
                exactProbability * 100
            ).toFixed(6) + "%",
            "Payout / total bet": payoutMultiplier,
            "RTP contribution, all lines": (
                exactProbability *
                payoutMultiplier *
                config.paylines.length *
                100
            ).toFixed(6) + "%",
        });
    }

    totalReturn += returnPerLine * config.paylines.length;
}

console.table(rows);

console.log(
    "\nTheoretical RTP:",
    `${(totalReturn * 100).toFixed(6)}%`,
);

console.log(
    "Expected player net per 100 credits wagered:",
    ((totalReturn - 1) * 100).toFixed(6),
);

console.log(
    "\nBet means the TOTAL amount charged per spin.",
);

console.log(
    "Each line currently pays using that full bet.",
);